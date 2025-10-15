import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Package, Trash2, Pencil, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageWithBoundingBoxes } from "@/components/ImageWithBoundingBoxes";
import { CardDetailsForm } from "@/components/CardDetailsForm";
import { formatCardTitle, formatCardSubtitle, getCardBadges } from "@/lib/cardFormatting";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";

interface EbayListing {
  title: string;
  price: number;
  condition: string;
  url: string;
  imageUrl: string;
  soldDate: string;
}

interface ItemDetails {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  acquired_date: string | null;
  cost: number | null;
  image_url: string | null;
  back_image_url: string | null;
  created_at: string;
  source_context: string | null;
  location: {
    name: string;
  } | null;
  detections?: Array<{
    label: string;
    confidence: number;
    bbox_x: number | null;
    bbox_y: number | null;
    bbox_width: number | null;
    bbox_height: number | null;
  }>;
  card_details?: {
    player_name: string;
    card_year: number;
    brand: string;
    set_name: string;
    sport: string;
    card_number: string;
    condition: string;
    is_graded: boolean;
    grading_company: string;
    grade: number;
    estimated_value: number;
    special_attributes: string[];
  };
}

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedQuantity, setEditedQuantity] = useState(1);
  const [editedAcquiredDate, setEditedAcquiredDate] = useState("");
  const [editedCost, setEditedCost] = useState("");
  const [editedCardDetails, setEditedCardDetails] = useState<any>(null);
  const [ebayComps, setEbayComps] = useState<EbayListing[]>([]);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          location:locations(name),
          detections(label, confidence, bbox_x, bbox_y, bbox_width, bbox_height),
          card_details(player_name, card_year, brand, set_name, sport, card_number, condition, is_graded, grading_company, grade, estimated_value, special_attributes)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setItem(data);
      setEditedName(data.name);
      setEditedCategory(data.category || "");
      setEditedQuantity(data.quantity);
      setEditedAcquiredDate(data.acquired_date || "");
      setEditedCost(data.cost?.toString() || "");
      
      // Initialize card details if they exist
      if (data.card_details) {
        setEditedCardDetails({
          player_name: data.card_details.player_name || '',
          card_year: data.card_details.card_year?.toString() || '',
          brand: data.card_details.brand || '',
          set_name: data.card_details.set_name || '',
          sport: data.card_details.sport || '',
          card_number: data.card_details.card_number || '',
          condition: data.card_details.condition || '',
          is_graded: data.card_details.is_graded || false,
          grading_company: data.card_details.grading_company || '',
          grade: data.card_details.grade?.toString() || '',
          estimated_value: data.card_details.estimated_value?.toString() || '',
          special_attributes: data.card_details.special_attributes || []
        });
        
        // Fetch mock eBay comps
        fetchMockEbayComps(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading item",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchMockEbayComps = (itemData: ItemDetails) => {
    if (!itemData.card_details) return;
    
    const cd = itemData.card_details;
    const mockComps: EbayListing[] = [
      {
        title: `${cd.card_year} ${cd.brand} ${cd.player_name} #${cd.card_number} ${cd.condition}`,
        price: 42.50,
        condition: "Near Mint",
        url: "#",
        imageUrl: itemData.image_url || "",
        soldDate: "2 days ago"
      },
      {
        title: `${cd.card_year} ${cd.brand} ${cd.player_name} ${cd.set_name}`,
        price: 38.00,
        condition: "Excellent",
        url: "#",
        imageUrl: itemData.image_url || "",
        soldDate: "5 days ago"
      },
      {
        title: `${cd.player_name} ${cd.card_year} Rookie Card`,
        price: 35.99,
        condition: "Near Mint",
        url: "#",
        imageUrl: itemData.image_url || "",
        soldDate: "1 week ago"
      }
    ];
    
    setEbayComps(mockComps);
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("items")
        .update({
          name: editedName,
          category: editedCategory || null,
          quantity: editedQuantity,
          acquired_date: editedAcquiredDate || null,
          cost: editedCost ? parseFloat(editedCost) : null,
        })
        .eq("id", id);

      if (error) throw error;

      // Update card details if they exist
      if (editedCardDetails && item?.card_details) {
        const { error: cardError } = await supabase
          .from("card_details")
          .update({
            player_name: editedCardDetails.player_name || null,
            card_year: editedCardDetails.card_year ? parseInt(editedCardDetails.card_year) : null,
            brand: editedCardDetails.brand || null,
            set_name: editedCardDetails.set_name || null,
            sport: editedCardDetails.sport || null,
            card_number: editedCardDetails.card_number || null,
            condition: editedCardDetails.condition || null,
            is_graded: editedCardDetails.is_graded,
            grading_company: editedCardDetails.is_graded ? editedCardDetails.grading_company : null,
            grade: editedCardDetails.is_graded && editedCardDetails.grade ? parseFloat(editedCardDetails.grade) : null,
            estimated_value: editedCardDetails.estimated_value ? parseFloat(editedCardDetails.estimated_value) : null,
            special_attributes: editedCardDetails.special_attributes,
          })
          .eq("item_id", id);

        if (cardError) throw cardError;
      }

      toast({ title: "Item updated!" });
      setEditDialogOpen(false);
      loadItem();
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Item deleted" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error deleting item",
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

  if (!item) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Item</DialogTitle>
                  <DialogDescription>
                    Update item details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Input
                        id="edit-category"
                        placeholder="Optional"
                        value={editedCategory}
                        onChange={(e) => setEditedCategory(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-quantity">Quantity</Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        min="1"
                        value={editedQuantity}
                        onChange={(e) => setEditedQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-acquired">Acquired Date</Label>
                      <Input
                        id="edit-acquired"
                        type="date"
                        value={editedAcquiredDate}
                        onChange={(e) => setEditedAcquiredDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cost">Cost</Label>
                      <Input
                        id="edit-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={editedCost}
                        onChange={(e) => setEditedCost(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Card Details Edit Section */}
                  {editedCardDetails && (
                    <div className="pt-4 border-t">
                      <CardDetailsForm
                        details={editedCardDetails}
                        onChange={setEditedCardDetails}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} className="flex-1">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this item
                    from your inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Display front and back images for sports cards */}
        {item.source_context === 'sports-cards' && item.image_url && item.back_image_url && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-muted-foreground">Front</p>
              <img
                src={item.image_url}
                alt={`${item.name} - Front`}
                className="w-full rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-muted-foreground">Back</p>
              <img
                src={item.back_image_url}
                alt={`${item.name} - Back`}
                className="w-full rounded-xl shadow-lg"
              />
            </div>
          </div>
        )}
        
        {/* Display with bounding boxes for non-sports items */}
        {item.source_context !== 'sports-cards' && item.image_url && item.detections && item.detections.length > 0 && (
          <ImageWithBoundingBoxes 
            imageUrl={item.image_url}
            detections={item.detections.map(d => ({
              label: d.label,
              confidence: d.confidence,
              bbox: d.bbox_x !== null ? {
                x: d.bbox_x,
                y: d.bbox_y!,
                width: d.bbox_width!,
                height: d.bbox_height!,
              } : undefined
            }))}
            className="w-full max-w-2xl mx-auto"
          />
        )}
        
        {/* Default single image display */}
        {item.source_context !== 'sports-cards' && item.image_url && (!item.detections || item.detections.length === 0) && (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full max-w-md mx-auto rounded-xl shadow-lg"
          />
        )}

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              {item.card_details ? (
                <>
                  <h1 className="text-2xl font-bold mb-2 leading-tight">
                    {formatCardTitle(item.name, item.card_details)}
                  </h1>
                  <p className="text-muted-foreground mb-3">
                    {formatCardSubtitle(item.card_details)}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {getCardBadges(item.card_details).map((badge, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
                  {item.category && (
                    <Badge variant="secondary">{item.category}</Badge>
                  )}
                </>
              )}
            </div>

            <div className="space-y-4">
              {item.quantity > 1 && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Package className="h-5 w-5" />
                  <span>Quantity: {item.quantity}</span>
                </div>
              )}

              {item.location && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{item.location.name}</span>
                </div>
              )}

              {item.acquired_date && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>Acquired: {new Date(item.acquired_date).toLocaleDateString()}</span>
                </div>
              )}

              {item.cost && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <DollarSign className="h-5 w-5" />
                  <span>Cost: ${item.cost.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>Added: {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Card Details Section */}
            {item.card_details && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Card Details</h3>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {item.card_details.player_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Player</p>
                          <p className="font-medium">{item.card_details.player_name}</p>
                        </div>
                      )}
                      {item.card_details.card_year && (
                        <div>
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium">{item.card_details.card_year}</p>
                        </div>
                      )}
                      {item.card_details.brand && (
                        <div>
                          <p className="text-sm text-muted-foreground">Brand</p>
                          <p className="font-medium">{item.card_details.brand}</p>
                        </div>
                      )}
                      {item.card_details.set_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Set</p>
                          <p className="font-medium">{item.card_details.set_name}</p>
                        </div>
                      )}
                      {item.card_details.sport && (
                        <div>
                          <p className="text-sm text-muted-foreground">Sport</p>
                          <p className="font-medium">{item.card_details.sport}</p>
                        </div>
                      )}
                      {item.card_details.card_number && (
                        <div>
                          <p className="text-sm text-muted-foreground">Card #</p>
                          <p className="font-medium">{item.card_details.card_number}</p>
                        </div>
                      )}
                      {item.card_details.condition && (
                        <div>
                          <p className="text-sm text-muted-foreground">Condition</p>
                          <p className="font-medium">{item.card_details.condition}</p>
                        </div>
                      )}
                      {item.card_details.is_graded && (
                        <>
                          {item.card_details.grading_company && (
                            <div>
                              <p className="text-sm text-muted-foreground">Graded By</p>
                              <p className="font-medium">{item.card_details.grading_company}</p>
                            </div>
                          )}
                          {item.card_details.grade && (
                            <div>
                              <p className="text-sm text-muted-foreground">Grade</p>
                              <p className="font-medium">{item.card_details.grade}</p>
                            </div>
                          )}
                        </>
                      )}
                      {item.card_details.estimated_value && (
                        <div>
                          <p className="text-sm text-muted-foreground">Est. Value</p>
                          <p className="font-medium">${item.card_details.estimated_value.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    {item.card_details.special_attributes && item.card_details.special_attributes.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Special Attributes</p>
                        <div className="flex flex-wrap gap-2">
                          {item.card_details.special_attributes.map((attr, i) => (
                            <Badge key={i} variant="secondary">{attr}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* eBay Comps Section */}
            {item.source_context === "sports-cards" && ebayComps.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Recent eBay Sales</h3>
                  <div className="space-y-3">
                    {ebayComps.map((comp, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <img 
                          src={comp.imageUrl} 
                          alt={comp.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{comp.title}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{comp.condition}</span>
                            <span>•</span>
                            <span>Sold {comp.soldDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${comp.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">
                      Average Market Value: ${(ebayComps.reduce((sum, comp) => sum + comp.price, 0) / ebayComps.length).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Demo data shown • Connect eBay API for live comps
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ItemDetail;