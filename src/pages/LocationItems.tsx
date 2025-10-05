import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Home, Search, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  image_url: string | null;
}

const LocationItems = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkAuthAndAccess();
  }, [locationId]);

  const checkAuthAndAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not authenticated - redirect to auth with return URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const returnUrl = token 
          ? `/location/${locationId}?token=${token}`
          : `/location/${locationId}`;
        navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Check if there's a token to validate
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        // Validate and grant access
        const { data, error } = await supabase.rpc('grant_shared_access', {
          p_location_id: locationId,
          p_share_token: token
        });

        if (error) {
          console.error('Error granting access:', error);
        }
        
        // Remove token from URL after processing
        window.history.replaceState({}, '', `/location/${locationId}`);
      }

      await loadLocationAndItems();
    } catch (error: any) {
      console.error('Error checking access:', error);
      setLoading(false);
    }
  };

  const loadLocationAndItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: location } = await supabase
        .from("locations")
        .select("name, user_id")
        .eq("id", locationId)
        .single();

      if (location) {
        setLocationName(location.name);
        setIsOwner(user?.id === location.user_id);
      }

      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .eq("location_id", locationId)
        .order("created_at", { ascending: false });

      if (itemsData) {
        setItems(itemsData);
      }
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{locationName}</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/qr-codes/${locationId}`)}
          >
            <QrCode className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!isOwner && (
          <div className="mb-4 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              You have view-only access to this location
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No items in this location yet</p>
            {isOwner && (
              <Button onClick={() => navigate("/scan")}>
                <Camera className="h-4 w-4 mr-2" />
                Scan Items
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                name={item.name}
                category={item.category || undefined}
                quantity={item.quantity}
                imageUrl={item.image_url || undefined}
                onClick={() => navigate(`/item/${item.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3">
        <div className="container mx-auto flex items-center justify-around max-w-lg">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <div className="flex flex-col items-center gap-1">
              <Home className="h-5 w-5" />
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

export default LocationItems;