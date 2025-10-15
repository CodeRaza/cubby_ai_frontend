import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Camera, Search, Sparkles, Crown, Shield, Settings as SettingsIcon, Home, Trophy, TrendingUp, Star, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PREDEFINED_LOCATIONS } from "@/lib/locationTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Location {
  id: string;
  name: string;
  itemCount: number;
}

interface SubscriptionStatus {
  plan_tier: string;
  scans_used: number;
  scans_limit: number;
  bonus_credits: number;
}

interface CardStats {
  total_cards: number;
  total_value: number;
  graded_count: number;
  sports_breakdown: Record<string, number>;
  top_cards: Array<{
    name: string;
    value: number;
    image_url: string;
  }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLocationName, setNewLocationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [deleteLocationName, setDeleteLocationName] = useState("");
  const [renameLocationId, setRenameLocationId] = useState<string | null>(null);
  const [renameLocationName, setRenameLocationName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showFirstScanPrompt, setShowFirstScanPrompt] = useState(false);
  const [totalItemsScanned, setTotalItemsScanned] = useState(0);
  const [source, setSource] = useState("");
  const [cardStats, setCardStats] = useState<CardStats | null>(null);

  useEffect(() => {
    // Get source from sessionStorage
    const userSource = sessionStorage.getItem('user_source') || '';
    setSource(userSource);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthChecked(true);
        
        if (!session) {
          navigate("/auth");
          return;
        }
        
        await loadLocations();
        await loadSubscription();
        await checkAdminStatus();
        
        if (userSource === 'sports-cards') {
          await loadCardStats();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuthChecked(true);
        navigate("/auth");
      }
    };

    initializeAuth();

    // Handle successful scan pack purchase
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pack_success') === 'true') {
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        handleScanPackSuccess(sessionId);
      }
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('success') === 'true') {
      // Subscription success
      toast({
        title: "Subscription activated!",
        description: "Your subscription is now active. Enjoy your scans!"
      });
      loadSubscription();
      window.history.replaceState({}, '', '/dashboard');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only redirect if auth is already checked and session is definitely gone
      if (authChecked && !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, authChecked]);

  const loadLocations = async () => {
    try {
      const { data: locationsData, error: locError } = await supabase
        .from("locations")
        .select("id, name, user_id, created_at")
        .order("created_at", { ascending: false });

      if (locError) throw locError;

      const locationsWithCounts = await Promise.all(
        (locationsData || []).map(async (loc) => {
          const { count } = await supabase
            .from("items")
            .select("*", { count: "exact", head: true })
            .eq("location_id", loc.id);

          return {
            id: loc.id,
            name: loc.name,
            itemCount: count || 0,
          };
        })
      );

      setLocations(locationsWithCounts);
      
      // Calculate total items scanned
      const totalItems = locationsWithCounts.reduce((sum, loc) => sum + loc.itemCount, 0);
      setTotalItemsScanned(totalItems);
      
      // Only redirect to onboarding if user came from auth and has no locations
      // Don't redirect if they explicitly skipped onboarding
      const hasCompletedOnboarding = sessionStorage.getItem('onboarding_completed');
      if (locationsWithCounts.length === 0 && !hasCompletedOnboarding && !window.location.search.includes('from_onboarding')) {
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({
        title: "Error loading locations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check subscription status with Stripe first
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-subscription');
      if (checkError) {
        console.error('Subscription check error:', checkError);
      }

      // Get subscription info from database
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;

      // Get usage info
      const { data: usageData, error: usageError } = await supabase
        .from('scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString())
        .maybeSingle();

      if (usageError) throw usageError;

      const planTier = subData?.plan_tier || 'free';
      const itemLimits: Record<string, number> = {
        free: 50,
        starter: 250,
        pro: 1000,
        power: 5000
      };

      setSubscription({
        plan_tier: planTier,
        scans_used: usageData?.items_detected || 0,
        scans_limit: itemLimits[planTier],
        bonus_credits: usageData?.bonus_items || 0
      });
    } catch (error: any) {
      console.error('Error loading subscription:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roles);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const loadCardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all items for the user with card details
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select(`
          id, 
          name,
          source_context,
          image_url,
          card_details(estimated_value, sport, is_graded)
        `)
        .eq("user_id", user.id)
        .eq("source_context", "sports-cards");

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        setCardStats({ 
          total_cards: 0, 
          total_value: 0, 
          graded_count: 0, 
          sports_breakdown: {},
          top_cards: []
        });
        return;
      }

      // Calculate stats
      const total_cards = items.length;
      let total_value = 0;
      let graded_count = 0;
      const sports_breakdown: Record<string, number> = {};
      const cardsWithValues: Array<{ name: string; value: number; image_url: string }> = [];

      items.forEach((item: any) => {
        const cardDetail = item.card_details;
        if (cardDetail) {
          const value = Number(cardDetail.estimated_value) || 0;
          total_value += value;
          
          if (cardDetail.is_graded) graded_count++;
          
          if (cardDetail.sport) {
            sports_breakdown[cardDetail.sport] = (sports_breakdown[cardDetail.sport] || 0) + 1;
          }

          if (value > 0) {
            cardsWithValues.push({
              name: item.name,
              value: value,
              image_url: item.image_url || ''
            });
          }
        }
      });

      // Get top 5 cards by value
      const top_cards = cardsWithValues
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setCardStats({ 
        total_cards, 
        total_value, 
        graded_count, 
        sports_breakdown,
        top_cards 
      });
    } catch (error) {
      console.error("Error loading card stats:", error);
    }
  };

  const handleCreateLocation = async (locationName: string) => {
    if (!locationName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("locations").insert({
        name: locationName,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Location created!" });
      setNewLocationName("");
      setDialogOpen(false);
      setShowCustomInput(false);
      
      // Show first scan prompt if user has no items
      if (totalItemsScanned === 0) {
        setShowFirstScanPrompt(true);
      }
      
      loadLocations();
      
      // Reload card stats for sports cards users
      if (source === 'sports-cards') {
        loadCardStats();
      }
    } catch (error: any) {
      toast({
        title: "Error creating location",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCustomLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateLocation(newLocationName);
  };

  const handleRenameLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameLocationId || !renameLocationName.trim()) return;

    try {
      const { error } = await supabase
        .from("locations")
        .update({ name: renameLocationName })
        .eq("id", renameLocationId);

      if (error) throw error;

      toast({ title: "Location renamed!" });
      setRenameLocationId(null);
      setRenameLocationName("");
      setRenameDialogOpen(false);
      loadLocations();
    } catch (error: any) {
      toast({
        title: "Error renaming location",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteLocationId) return;

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", deleteLocationId);

      if (error) throw error;

      toast({ title: "Location deleted" });
      setDeleteLocationId(null);
      setDeleteLocationName("");
      loadLocations();
    } catch (error: any) {
      toast({
        title: "Error deleting location",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleScanPackSuccess = async (sessionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      toast({
        title: "Item pack added!",
        description: "100 bonus items have been added to your account."
      });

      loadSubscription();
    } catch (error: any) {
      console.error('Error processing scan pack:', error);
      toast({
        title: "Error processing purchase",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const totalScans = subscription ? subscription.scans_limit + subscription.bonus_credits : 0;
  const scansUsed = subscription?.scans_used || 0;
  const scansRemaining = Math.max(0, totalScans - scansUsed);
  const usagePercent = totalScans > 0 ? (scansUsed / totalScans) * 100 : 0;
  const planName = subscription?.plan_tier ? subscription.plan_tier.charAt(0).toUpperCase() + subscription.plan_tier.slice(1) : 'Free';

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{source === 'sports-cards' ? 'Card Collection' : 'Cubby'}</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="gap-2"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">{planName}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Subscription Status Banner */}
      {subscription && (
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Items this month</span>
                {subscription.bonus_credits > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    +{subscription.bonus_credits} bonus
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {scansRemaining} of {totalScans} remaining
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            {scansRemaining <= 10 && scansRemaining > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Running low on items! Consider upgrading or buying an item pack.
              </p>
            )}
            {scansRemaining === 0 && (
              <p className="text-xs text-destructive mt-2">
                Out of items! Upgrade your plan or purchase an item pack to continue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Card Stats for Sports Cards Users */}
      {source === 'sports-cards' && cardStats && cardStats.total_cards > 0 && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{cardStats.total_cards}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Cards</p>
              </div>
              <div className="text-center border-x border-border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">${cardStats.total_value.toFixed(0)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Est. Value</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{cardStats.graded_count}</span>
                </div>
                <p className="text-xs text-muted-foreground">Graded</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Gamification Banner for non-sports-cards users */}
      {source !== 'sports-cards' && locations.length > 0 && totalItemsScanned < 10 && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted opacity-20"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(totalItemsScanned / 10) * 125.6} 125.6`}
                      className="text-primary transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {totalItemsScanned}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">
                  {totalItemsScanned === 0 && "🎯 Start your inventory journey!"}
                  {totalItemsScanned > 0 && totalItemsScanned < 5 && "🌟 Great start! Keep going!"}
                  {totalItemsScanned >= 5 && totalItemsScanned < 10 && "🔥 You're on fire!"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {10 - totalItemsScanned} items away from organizing like a pro
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/scan")}
                className="flex-shrink-0"
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* First Scan Prompt Dialog */}
      <Dialog open={showFirstScanPrompt} onOpenChange={setShowFirstScanPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">🎉 Location Created!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Now let's add your first item! Scanning takes just 30 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">✨ What you can do:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                {source === 'sports-cards' ? (
                  <>
                    <li>Scan multiple cards at once with AI</li>
                    <li>Track card values & conditions</li>
                    <li>Search by player, year, or brand</li>
                  </>
                ) : (
                  <>
                    <li>Scan multiple items at once with AI</li>
                    <li>Add expiry dates & reminders</li>
                    <li>Search your inventory instantly</li>
                  </>
                )}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                onClick={() => {
                  setShowFirstScanPrompt(false);
                  navigate("/scan");
                }}
                className="w-full"
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Scanning Now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFirstScanPrompt(false)}
              >
                I'll do this later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{source === 'sports-cards' ? 'Collections' : 'Locations'}</h2>
            <p className="text-muted-foreground">
              {source === 'sports-cards' ? 'Organize your cards by collection' : 'Organize items by location'}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {source === 'sports-cards' ? 'Add Collection' : 'Add Location'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{source === 'sports-cards' ? 'Add Collection' : 'Add Location'}</DialogTitle>
                <DialogDescription>
                  {source === 'sports-cards' ? 'Create a collection for your cards' : 'Select a preset or enter your own name'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pb-2">
                <div className="space-y-2">
                  <Label htmlFor="quick-location-name">
                    {source === 'sports-cards' ? 'Collection Name' : 'Location Name'}
                  </Label>
                  <Input
                    id="quick-location-name"
                    placeholder={source === 'sports-cards' 
                      ? 'e.g., Baseball Cards, Rookie Cards...' 
                      : 'Type your own or click a preset below'
                    }
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Quick Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(source === 'sports-cards' ? [
                      { id: 'baseball', name: 'Baseball Cards', icon: Trophy },
                      { id: 'basketball', name: 'Basketball Cards', icon: Trophy },
                      { id: 'football', name: 'Football Cards', icon: Trophy },
                      { id: 'hockey', name: 'Hockey Cards', icon: Trophy },
                      { id: 'rookie', name: 'Rookie Cards', icon: Star },
                      { id: 'graded', name: 'Graded Cards', icon: Shield },
                    ] : PREDEFINED_LOCATIONS).map((locationType) => {
                      const IconComponent = locationType.icon;
                      return (
                        <Button
                          key={locationType.id}
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2"
                          onClick={() => setNewLocationName(locationType.name)}
                          type="button"
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="text-xs">{locationType.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="sticky bottom-0 bg-background pt-4 pb-2">
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleCreateLocation(newLocationName);
                    }}
                    className="w-full"
                    disabled={!newLocationName.trim()}
                  >
                    {source === 'sports-cards' ? 'Add Collection' : 'Add Location'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {locations.length === 0 ? (
          <Card className="border-dashed">
            <div className="text-center py-12 px-6">
              <div className="mb-4">
                {source === 'sports-cards' ? (
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50" />
                ) : (
                  <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {source === 'sports-cards' ? 'No collections yet' : 'No locations yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {source === 'sports-cards' 
                  ? 'Create your first collection to start cataloging your cards. Collections help you organize by sport, set, or type.'
                  : 'Create your first location to start organizing and scanning items. Locations help you track where everything is stored.'
                }
              </p>
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {source === 'sports-cards' ? 'Create Your First Collection' : 'Create Your First Location'}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/qr-codes/bulk")}
              >
                <Camera className="h-4 w-4 mr-2" />
                Print All QR Codes
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  id={location.id}
                  name={location.name}
                  itemCount={location.itemCount}
                  onClick={() => navigate(`/location/${location.id}`)}
                  onQRClick={(e) => {
                    e.stopPropagation();
                    navigate(`/qr-codes/${location.id}`);
                  }}
                  onRenameClick={(e) => {
                    e.stopPropagation();
                    setRenameLocationId(location.id);
                    setRenameLocationName(location.name);
                    setRenameDialogOpen(true);
                  }}
                  onDeleteClick={(e) => {
                    e.stopPropagation();
                    setDeleteLocationId(location.id);
                    setDeleteLocationName(location.name);
                  }}
                />
              ))}
            </div>
            
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Location</DialogTitle>
                  <DialogDescription>
                    Enter a new name for this location
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRenameLocation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rename-location">Location Name</Label>
                    <Input
                      id="rename-location"
                      value={renameLocationName}
                      onChange={(e) => setRenameLocationName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setRenameDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Rename
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!deleteLocationId} onOpenChange={(open) => !open && setDeleteLocationId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Location?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{deleteLocationName}"? This will also delete all items in this location. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteLocation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* Card Charts & Analytics for Sports Cards Users */}
        {source === 'sports-cards' && cardStats && cardStats.total_cards > 0 && (
          <div className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sports Breakdown Pie Chart */}
              {Object.keys(cardStats.sports_breakdown).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Collection Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(cardStats.sports_breakdown).map(([sport, count]) => ({
                            name: sport,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {Object.entries(cardStats.sports_breakdown).map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Top Cards by Value */}
              {cardStats.top_cards.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Top Valuable Cards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cardStats.top_cards.map((card, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        {card.image_url && (
                          <img 
                            src={card.image_url} 
                            alt={card.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.name}</p>
                        </div>
                        <div className="flex items-center gap-1 text-primary font-semibold">
                          <DollarSign className="h-4 w-4" />
                          {card.value.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Value Distribution Bar Chart */}
            {cardStats.top_cards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Value Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cardStats.top_cards}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t px-4 py-3 safe-bottom">
        <div className="container mx-auto flex items-center justify-around max-w-lg">
          <Button 
            variant="ghost" 
            className="flex-col h-auto py-2 px-4 gap-1 active:scale-95 transition-transform" 
            onClick={() => navigate("/dashboard")}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          <Button
            size="icon"
            className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl active:scale-90 transition-all"
            onClick={() => navigate("/scan")}
          >
            <Camera className="h-7 w-7" />
          </Button>
          <Button 
            variant="ghost" 
            className="flex-col h-auto py-2 px-4 gap-1 active:scale-95 transition-transform" 
            onClick={() => navigate("/search")}
          >
            <Search className="h-6 w-6" />
            <span className="text-xs font-medium">Search</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;