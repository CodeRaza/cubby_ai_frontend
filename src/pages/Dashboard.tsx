import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Camera, Trophy, TrendingUp, Star, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { PREDEFINED_LOCATIONS, SPORTS_COLLECTIONS } from "@/lib/locationTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopMovers } from "@/components/TopMovers";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { CardStatsOverview } from "@/components/dashboard/CardStatsOverview";
import { LocationsList } from "@/components/dashboard/LocationsList";
import { TopValuableCards } from "@/components/dashboard/TopValuableCards";
import { CollectionBreakdown } from "@/components/dashboard/CollectionBreakdown";
import { useLocations, useSubscription, useAdminStatus, useCardStats, useCollectionStats } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newLocationName, setNewLocationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [deleteLocationName, setDeleteLocationName] = useState("");
  const [renameLocationId, setRenameLocationId] = useState<string | null>(null);
  const [renameLocationName, setRenameLocationName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showFirstScanPrompt, setShowFirstScanPrompt] = useState(false);
  const [source, setSource] = useState("");

  // Use custom hooks for data fetching
  const { data: locationsData, isLoading: locationsLoading, refetch: refetchLocations } = useLocations();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: isAdmin, isLoading: adminLoading } = useAdminStatus();
  const { data: cardStats, isLoading: cardStatsLoading } = useCardStats(source === 'sports-cards');
  const { data: collectionStats, isLoading: collectionStatsLoading } = useCollectionStats(source === 'sports-cards');

  const locations = locationsData?.locations || [];
  const totalItemsScanned = locationsData?.totalItems || 0;

  useEffect(() => {
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
      window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('success') === 'true') {
      toast({
        title: "Subscription activated!",
        description: "Your subscription is now active. Enjoy your scans!"
      });
      window.history.replaceState({}, '', '/dashboard');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (authChecked && !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, authChecked]);

  // Check if should redirect to onboarding
  useEffect(() => {
    if (!locationsLoading && locations.length === 0) {
      const hasCompletedOnboarding = sessionStorage.getItem('onboarding_completed');
      if (!hasCompletedOnboarding && !window.location.search.includes('from_onboarding')) {
        navigate("/onboarding");
      }
    }
  }, [locations, locationsLoading, navigate]);

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
      
      if (totalItemsScanned === 0) {
        setShowFirstScanPrompt(true);
      }
      
      refetchLocations();
    } catch (error: any) {
      toast({
        title: "Error creating location",
        description: error.message,
        variant: "destructive",
      });
    }
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
      refetchLocations();
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
      refetchLocations();
    } catch (error: any) {
      toast({
        title: "Error deleting location",
        description: error.message,
        variant: "destructive",
      });
    }
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
    } catch (error: any) {
      console.error('Error processing scan pack:', error);
      toast({
        title: "Error processing purchase",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const planName = useMemo(() => {
    if (!subscription) return 'Free';
    return subscription.plan_tier.charAt(0).toUpperCase() + subscription.plan_tier.slice(1);
  }, [subscription]);

  if (!authChecked || locationsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <DashboardHeader 
        source={source} 
        isAdmin={isAdmin || false} 
        planName={planName} 
      />

      {subscription && <SubscriptionBanner subscription={subscription} />}

      {source === 'sports-cards' && (
        <CardStatsOverview cardStats={cardStats} isLoading={cardStatsLoading} />
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

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{source === 'sports-cards' ? 'Collections' : 'Locations'}</h2>
            <p className="text-sm text-muted-foreground">
              {source === 'sports-cards' ? 'Organize your cards by collection' : 'Organize items by location'}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">{source === 'sports-cards' ? 'Add Collection' : 'Add Location'}</span>
                <span className="xs:hidden">Add</span>
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
                    {(source === 'sports-cards' ? SPORTS_COLLECTIONS : PREDEFINED_LOCATIONS).map((locationType) => {
                      const IconComponent = locationType.icon;
                      const emoji = 'emoji' in locationType ? locationType.emoji : undefined;
                      return (
                        <Button
                          key={locationType.id}
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2"
                          onClick={() => setNewLocationName(locationType.name)}
                          type="button"
                        >
                          {emoji ? (
                            <span className="text-2xl">{emoji}</span>
                          ) : (
                            <IconComponent className="h-5 w-5" />
                          )}
                          <span className="text-xs text-center">{locationType.name}</span>
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

        <LocationsList
          locations={locations}
          source={source}
          isLoading={locationsLoading}
          collectionStats={collectionStats || []}
          onOpenDialog={() => setDialogOpen(true)}
          onRename={(id, name) => {
            setRenameLocationId(id);
            setRenameLocationName(name);
            setRenameDialogOpen(true);
          }}
          onDelete={(id, name) => {
            setDeleteLocationId(id);
            setDeleteLocationName(name);
          }}
        />
            
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

        {/* Card Charts & Analytics for Sports Cards Users */}
        {source === 'sports-cards' && cardStats && cardStats.total_cards > 0 && !cardStatsLoading && (
          <div className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collection Breakdown */}
              <CollectionBreakdown 
                sportsBreakdown={cardStats.sports_breakdown}
                totalValue={cardStats.total_value}
                isLoading={cardStatsLoading}
              />

              {/* Top Valuable Cards */}
              <TopValuableCards 
                cards={cardStats.top_cards}
                isLoading={cardStatsLoading}
              />
              
              {/* Top Movers Component */}
              <TopMovers />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3 z-50">
        <div className="container mx-auto flex items-center justify-around max-w-lg">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <div className="flex flex-col items-center gap-1">
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </div>
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => navigate("/scan")}
          >
            <Camera className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/search")}>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Search</span>
            </div>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
