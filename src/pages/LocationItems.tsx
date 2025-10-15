import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Home, Search, QrCode, CheckSquare, Square, FolderInput, Filter, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { CollectionPortfolioChart } from "@/components/collection/CollectionPortfolioChart";
import { CollectionTopMovers } from "@/components/collection/CollectionTopMovers";
import { CollectionDistribution } from "@/components/collection/CollectionDistribution";
import { useCollectionDetails } from "@/hooks/useCollectionDetails";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Item {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  image_url: string | null;
  card_details?: {
    player_name?: string;
    card_year?: number;
    brand?: string;
    card_number?: string;
    set_name?: string;
    condition?: string;
    is_graded?: boolean;
    grading_company?: string;
    grade?: number;
    special_attributes?: string[];
  } | null;
}

interface Location {
  id: string;
  name: string;
}

const LocationItems = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [isSportsCards, setIsSportsCards] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch collection details for sports cards
  const { data: collectionDetails } = useCollectionDetails(locationId, isSportsCards);

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
        .select("id, name, user_id, created_at")
        .eq("id", locationId)
        .single();

      if (location) {
        setLocationName(location.name);
        setIsOwner(user?.id === location.user_id);
      }

      const { data: itemsData } = await supabase
        .from("items")
        .select(`
          *,
          card_details(*)
        `)
        .eq("location_id", locationId)
        .order("created_at", { ascending: false });

      if (itemsData) {
        setItems(itemsData);
        // Check if this is a sports cards collection
        const hasSportsCards = itemsData.some(item => item.source_context === "sports-cards");
        setIsSportsCards(hasSportsCards);
      }

      // Load available locations for moving items
      if (user?.id) {
        const { data: locations } = await supabase
          .from("locations")
          .select("id, name")
          .eq("user_id", user.id)
          .neq("id", locationId)
          .order("name");
        
        if (locations) {
          setAvailableLocations(locations);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleMoveItems = async () => {
    if (!targetLocationId || selectedItems.size === 0) return;

    try {
      const { error } = await supabase
        .from("items")
        .update({ location_id: targetLocationId })
        .in("id", Array.from(selectedItems));

      if (error) throw error;

      toast({
        title: "Items moved!",
        description: `${selectedItems.size} item(s) moved successfully.`,
      });

      // Reload items and reset state
      await loadLocationAndItems();
      setSelectedItems(new Set());
      setSelectionMode(false);
      setMoveDialogOpen(false);
      setTargetLocationId("");
    } catch (error: any) {
      toast({
        title: "Error moving items",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteItems = async () => {
    if (selectedItems.size === 0) return;

    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .in("id", Array.from(selectedItems));

      if (error) throw error;

      toast({
        title: "Items deleted!",
        description: `${selectedItems.size} item(s) deleted successfully.`,
      });

      // Reload items and reset state
      await loadLocationAndItems();
      setSelectedItems(new Set());
      setSelectionMode(false);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error deleting items",
        description: error.message,
        variant: "destructive",
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{locationName}</h1>
              <p className="text-sm text-muted-foreground">
                {selectionMode ? `${selectedItems.size} selected` : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && items.length > 0 && (
              <>
                {!selectionMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedItems(new Set());
                      }}
                    >
                      Cancel
                    </Button>
                    {selectedItems.size > 0 && selectedItems.size < items.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAll}
                      >
                        Select All
                      </Button>
                    )}
                    {selectedItems.size === items.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                      >
                        Deselect All
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
            {!selectionMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/qr-codes/${locationId}`)}
              >
                <QrCode className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Move items action bar */}
        {selectionMode && selectedItems.size > 0 && (
          <div className="border-t bg-card">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.size} item(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => setMoveDialogOpen(true)}
                  disabled={availableLocations.length === 0}
                >
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to...
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {!isOwner && (
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              You have view-only access to this location
            </p>
          </div>
        )}

        {/* Sports Cards Collection Insights */}
        {isSportsCards && collectionDetails && (
          <div className="space-y-6">
            <CollectionHeader
              name={locationName}
              totalValue={collectionDetails.totalValue}
              weeklyChange={collectionDetails.weeklyChange}
              weeklyChangePercent={collectionDetails.weeklyChangePercent}
              monthlyChange={collectionDetails.monthlyChange}
              monthlyChangePercent={collectionDetails.monthlyChangePercent}
              cardCount={collectionDetails.cardCount}
            />

            <CollectionPortfolioChart data={collectionDetails.chartData} />

            <CollectionTopMovers movers={collectionDetails.topMovers} />

            <CollectionDistribution
              byPlayer={collectionDetails.distribution.byPlayer}
              byYear={collectionDetails.distribution.byYear}
              byCardType={collectionDetails.distribution.byCardType}
              byGrading={collectionDetails.distribution.byGrading}
            />
          </div>
        )}

        {/* Items Grid */}
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
          <div>
            {isSportsCards && collectionDetails && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">All Cards</h2>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="relative">
                  {selectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="bg-background border-2 shadow-lg"
                      />
                    </div>
                  )}
                  <ItemCard
                    name={item.name}
                    category={item.category || undefined}
                    quantity={item.quantity}
                    imageUrl={item.image_url || undefined}
                    onClick={() => !selectionMode && navigate(`/item/${item.id}`)}
                    cardDetails={item.card_details || undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Move Items Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items</DialogTitle>
            <DialogDescription>
              Select a collection to move {selectedItems.size} item(s) to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={targetLocationId} onValueChange={setTargetLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a collection..." />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMoveDialogOpen(false);
                  setTargetLocationId("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleMoveItems}
                disabled={!targetLocationId}
              >
                Move Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Items Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Items?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.size} item(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItems}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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