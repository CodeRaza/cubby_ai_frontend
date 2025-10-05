import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Camera, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLocationName, setNewLocationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadLocations();
    };

    checkAuth();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Cubby</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

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

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3">
        <div className="container mx-auto flex items-center justify-around max-w-lg">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <div className="flex flex-col items-center gap-1">
              <Plus className="h-5 w-5" />
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