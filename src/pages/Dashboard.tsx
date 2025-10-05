import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Camera, Search, Sparkles, Crown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLocationName, setNewLocationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadLocations();
      loadSubscription();
    };

    checkAuth();

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
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadLocations = async () => {
    try {
      const { data: locationsData, error: locError } = await supabase
        .from("locations")
        .select("*")
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

      // Get subscription info
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;

      // Get usage info
      const { data: usageData, error: usageError } = await supabase
        .from('scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString())
        .single();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;

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

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("locations").insert({
        name: newLocationName,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Location created!" });
      setNewLocationName("");
      setDialogOpen(false);
      loadLocations();
    } catch (error: any) {
      toast({
        title: "Error creating location",
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

  if (loading) {
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
          <h1 className="text-xl font-bold">Cubby</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="gap-2"
            >
              <Crown className="h-4 w-4" />
              {planName}
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

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Locations</h2>
            <p className="text-muted-foreground">Organize items by location</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Location</DialogTitle>
                <DialogDescription>
                  Add a new location to organize your items
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    placeholder="e.g., Garage, Pantry, Storage"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Location
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No locations yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Location
            </Button>
          </div>
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
                />
              ))}
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t px-4 py-3 safe-bottom">
        <div className="container mx-auto flex items-center justify-around max-w-lg">
          <Button 
            variant="ghost" 
            className="flex-col h-auto py-2 px-4 gap-1 active:scale-95 transition-transform" 
            onClick={() => navigate("/dashboard")}
          >
            <Plus className="h-6 w-6" />
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