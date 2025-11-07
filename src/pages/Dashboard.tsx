import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Search, Trophy, Star, Shield } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { CardStatsOverview } from "@/components/dashboard/CardStatsOverview";
import { LocationsList } from "@/components/dashboard/LocationsList";
import { TopValuableCards } from "@/components/dashboard/TopValuableCards";
import { CollectionBreakdown } from "@/components/dashboard/CollectionBreakdown";
import { TopMovers } from "@/components/TopMovers";
import { useLocations, useSubscription, useAdminStatus, useCardStats, useCollectionStats } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [source, setSource] = useState("");
  const [showFirstScanPrompt, setShowFirstScanPrompt] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameLocationId, setRenameLocationId] = useState(null);
  const [renameLocationName, setRenameLocationName] = useState("");
  const [deleteLocationId, setDeleteLocationId] = useState(null);
  const [deleteLocationName, setDeleteLocationName] = useState("");

  // Custom hooks for data fetching with real-time updates
  const { data: locationsData, isLoading: locationsLoading, refetch: refetchLocations } = useLocations();
  const { data: subscription, refetch: refetchSubscription } = useSubscription();
  const { data: isAdmin } = useAdminStatus();
  const { data: cardStats, refetch: refetchCardStats } = useCardStats(source === "sports-cards");
  const { data: collectionStats, refetch: refetchCollectionStats } = useCollectionStats(source === "sports-cards");
  
  // Get query client for manual invalidation
  const queryClient = useQueryClient();

  const locations = locationsData?.locations || [];
  const totalItemsScanned = locationsData?.totalItems || 0;

  // 🔐 Check auth on mount
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    if (!token) {
      navigate("/auth");
      return;
    }

    setAuthChecked(true);
    // Default to sports-cards if source not set (since we're using sports-cards flow)
    const userSource = sessionStorage.getItem("user_source") || "sports-cards";
    setSource(userSource);
  }, [navigate]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (authChecked && !locationsLoading && locations.length === 0) {
      const hasCompletedOnboarding = sessionStorage.getItem("onboarding_completed");
      if (!hasCompletedOnboarding && !window.location.search.includes("from_onboarding")) {
        navigate("/onboarding");
      }
    }
  }, [authChecked, locations, locationsLoading, navigate]);

  // Real-time updates: Refetch data when page becomes visible or user navigates back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && authChecked) {
        // Page became visible - refetch all data
        refetchLocations();
        refetchSubscription();
        if (source === "sports-cards") {
          refetchCardStats();
          refetchCollectionStats();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authChecked, source, refetchLocations, refetchSubscription, refetchCardStats, refetchCollectionStats]);

  // 🏗 Create new location/collection
  const handleCreateLocation = async (locationName: string) => {
    if (!locationName.trim()) return;
    try {
      await api.post(
        "/api/cards/collections/",
        { name: locationName }
      );

      setNewLocationName("");
      setDialogOpen(false);
      toast({ title: source === "sports-cards" ? "Collection created successfully" : "Location created successfully" });
      
      // Invalidate and refetch all dashboard queries for real-time update
      queryClient.invalidateQueries({ queryKey: ['dashboard-locations'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      refetchLocations();
      refetchCollectionStats();

      if (totalItemsScanned === 0) setShowFirstScanPrompt(true);
    } catch (err: any) {
      toast({ 
        title: source === "sports-cards" ? "Error creating collection" : "Error creating location",
        description: err?.response?.data?.detail || err?.message || "Please try again",
        variant: "destructive" 
      });
      console.error(err);
    }
  };

  // ✏️ Rename location
  const handleRenameLocation = async (e) => {
    e.preventDefault();
    if (!renameLocationId || !renameLocationName.trim()) return;
    try {
      await api.put(`/api/cards/collections/${renameLocationId}/`, {
        name: renameLocationName,
      });
      setRenameDialogOpen(false);
      setRenameLocationId(null);
      setRenameLocationName("");
      
      // Invalidate and refetch for real-time update
      queryClient.invalidateQueries({ queryKey: ['dashboard-locations'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      refetchLocations();
      refetchCollectionStats();
      toast({ title: "Location renamed" });
    } catch (err) {
      toast({ title: "Error renaming location", variant: "destructive" });
      console.error(err);
    }
  };

  // ❌ Delete location
  const handleDeleteLocation = async () => {
    try {
      await api.delete(`/api/cards/collections/${deleteLocationId}/`);
      setDeleteLocationId(null);
      setDeleteLocationName("");
      
      // Invalidate and refetch for real-time update
      queryClient.invalidateQueries({ queryKey: ['dashboard-locations'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-stats'] });
      refetchLocations();
      refetchCollectionStats();
      refetchCardStats();
      toast({ title: "Location deleted" });
    } catch (err) {
      toast({ title: "Error deleting location", variant: "destructive" });
      console.error(err);
    }
  };

  const planName = useMemo(() => {
    if (!subscription) return "Free";
    return (
      subscription.plan_tier.charAt(0).toUpperCase() + subscription.plan_tier.slice(1)
    );
  }, [subscription]);

  if (!authChecked || locationsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <DashboardHeader source={source} isAdmin={isAdmin || false} planName={planName} />
      {subscription && <SubscriptionBanner subscription={subscription} />}
      {source === "sports-cards" && (
        <CardStatsOverview cardStats={cardStats} isLoading={false} />
      )}

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {source === "sports-cards" ? "Collections" : "Locations"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {source === "sports-cards"
                ? "Organize your cards by collection"
                : "Organize items by location"}
            </p>
          </div>

          {/* Add Location Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Collection</DialogTitle>
                <DialogDescription>
                  Create a collection for your cards.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="collection-name">Collection Name</Label>
                  <Input
                    id="collection-name"
                    placeholder="e.g., Baseball Cards, Rookie Cards..."
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLocationName.trim()) {
                        handleCreateLocation(newLocationName);
                      }
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SPORTS_COLLECTIONS.map((collection) => (
                      <Button
                        key={collection.id}
                        type="button"
                        variant="outline"
                        className="h-auto flex-col gap-2 py-3"
                        onClick={async () => {
                          await handleCreateLocation(collection.name);
                          setDialogOpen(false);
                        }}
                      >
                        {collection.emoji ? (
                          <span className="text-xl">{collection.emoji}</span>
                        ) : (
                          <collection.icon className="h-5 w-5" />
                        )}
                        <span className="text-xs">{collection.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleCreateLocation(newLocationName)}
                  disabled={!newLocationName.trim()}
                  className="w-full"
                  size="lg"
                >
                  Add Collection
                </Button>
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

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRenameLocation} className="space-y-4">
              <Input
                value={renameLocationName}
                onChange={(e) => setRenameLocationName(e.target.value)}
              />
              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Alert */}
        <AlertDialog
          open={!!deleteLocationId}
          onOpenChange={(open) => !open && setDeleteLocationId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteLocationName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLocation}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      {/* Bottom Nav */}
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
              <Search className="h-5 w-5" />
              <span className="text-xs">Search</span>
            </div>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
