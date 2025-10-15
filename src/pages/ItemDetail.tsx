import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Package, Trash2, Pencil, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageWithBoundingBoxes } from "@/components/ImageWithBoundingBoxes";
import { CardDetailsForm } from "@/components/CardDetailsForm";
import { formatCardTitle, formatCardSubtitle, getCardBadges } from "@/lib/cardFormatting";
import { PriceTrend } from "@/components/PriceTrend";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { RecentSales } from "@/components/RecentSales";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";

interface ItemDetails {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  acquired_date: string | null;
  cost: number | null;
  sold: boolean;
  sold_price: number | null;
  sold_date: string | null;
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
    id?: string;
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
    price_trend_7d?: number;
    price_trend_30d?: number;
    last_sale_price?: number;
    last_sale_date?: string;
    last_price_update?: string;
  };
}

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedQuantity, setEditedQuantity] = useState(1);
  const [editedAcquiredDate, setEditedAcquiredDate] = useState("");
  const [editedCost, setEditedCost] = useState("");
  const [editedCardDetails, setEditedCardDetails] = useState<any>(null);
  const [sold, setSold] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");
  const [soldDate, setSoldDate] = useState("");
  const [hasSalesData, setHasSalesData] = useState(false);

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
          card_details(id, player_name, card_year, brand, set_name, sport, card_number, condition, is_graded, grading_company, grade, estimated_value, special_attributes, price_trend_7d, price_trend_30d, last_sale_price, last_sale_date, last_price_update)
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
      setSold(data.sold || false);
      setSoldPrice(data.sold_price?.toString() || "");
      setSoldDate(data.sold_date || "");
      
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
        
        // Check if we have actual sales data
        if (data.card_details.id) {
          const { data: salesData } = await supabase
            .from('price_history')
            .select('id')
            .eq('card_id', data.card_details.id)
            .limit(1);
          
          setHasSalesData(salesData && salesData.length > 0);
        }
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
          sold: sold,
          sold_price: soldPrice ? parseFloat(soldPrice) : null,
          sold_date: soldDate || null,
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
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

                  {/* Sold Status Section */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="edit-sold">Mark as Sold</Label>
                        <p className="text-sm text-muted-foreground">Track when you sell this item</p>
                      </div>
                      <Switch
                        id="edit-sold"
                        checked={sold}
                        onCheckedChange={setSold}
                      />
                    </div>
                    
                    {sold && (
                      <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                        <div className="space-y-2">
                          <Label htmlFor="edit-sold-price">Sold Price</Label>
                          <Input
                            id="edit-sold-price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={soldPrice}
                            onChange={(e) => setSoldPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-sold-date">Sold Date</Label>
                          <Input
                            id="edit-sold-date"
                            type="date"
                            value={soldDate}
                            onChange={(e) => setSoldDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
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

              {item.sold && item.sold_price && (
                <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">Sold: ${item.sold_price.toFixed(2)}</span>
                  {item.sold_date && (
                    <span className="text-sm">on {new Date(item.sold_date).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>Added: {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* P&L Section */}
            {(item.cost || item.sold_price) && (item.card_details?.estimated_value || item.sold_price) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Profit & Loss
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.sold && item.sold_price && item.cost ? (
                      <Card className={`${
                        item.sold_price - item.cost > 0
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">Realized Gain/Loss</p>
                          <div className="flex items-center gap-2">
                            {item.sold_price - item.cost > 0 ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                            <p className={`text-2xl font-bold ${
                              item.sold_price - item.cost > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${Math.abs(item.sold_price - item.cost).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {((item.sold_price - item.cost) / item.cost * 100).toFixed(1)}% return
                          </p>
                        </CardContent>
                      </Card>
                    ) : !item.sold && item.card_details?.estimated_value && item.cost ? (
                      <Card className={`${
                        item.card_details.estimated_value - item.cost > 0
                          ? 'bg-blue-500/5 border-blue-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">Unrealized Gain/Loss</p>
                          <div className="flex items-center gap-2">
                            {item.card_details.estimated_value - item.cost > 0 ? (
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                            <p className={`text-2xl font-bold ${
                              item.card_details.estimated_value - item.cost > 0 
                                ? 'text-blue-600' 
                                : 'text-red-600'
                            }`}>
                              ${Math.abs(item.card_details.estimated_value - item.cost).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {((item.card_details.estimated_value - item.cost) / item.cost * 100).toFixed(1)}% potential return
                          </p>
                        </CardContent>
                      </Card>
                    ) : null}

                    {item.cost && (
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">Cost Basis</p>
                          <p className="text-2xl font-bold">${item.cost.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {item.acquired_date 
                              ? `Acquired ${new Date(item.acquired_date).toLocaleDateString()}`
                              : 'Original purchase price'}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {!item.sold && (
                    <div className="text-center p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 Unrealized gains represent potential profit based on current market value
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card-specific sections only for cards */}
        {item.card_details && (
          <Card>
            <CardContent className="pt-6 space-y-6">
                <Separator />
                
                {/* Pricing Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Market Value
                    </h3>
                    <div className="flex items-center gap-2">
                      {item.card_details.estimated_value && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              toast({
                                title: "Fetching live market data...",
                                description: "This may take a few seconds"
                              });
                              
                              const { error } = await supabase.functions.invoke('fetch-card-pricing', {
                                body: { 
                                  cardId: item.card_details?.id,
                                  cardDetails: item.card_details,
                                  force_refresh: true
                                }
                              });
                              if (error) throw error;
                              
                              toast({
                                title: "Market data updated",
                                description: "Latest pricing and sales data loaded"
                              });
                              
                              // Invalidate recent sales query to refresh the component
                              queryClient.invalidateQueries({ queryKey: ['recent-sales', item.card_details?.id] });
                              
                              // Refresh to check for sales data
                              loadItem();
                            } catch (error: any) {
                              toast({
                                title: "Error refreshing pricing",
                                description: error.message,
                                variant: "destructive"
                              });
                            }
                          }}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </Button>
                      )}
                      <PriceAlertDialog cardId={item.card_details.id!} />
                    </div>
                  </div>
                  
                  {item.card_details.estimated_value ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className={`${
                          item.card_details.price_trend_7d && item.card_details.price_trend_7d > 0
                            ? 'bg-green-500/5 border-green-500/20'
                            : item.card_details.price_trend_7d && item.card_details.price_trend_7d < 0
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-muted/30'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-muted-foreground">
                                  {hasSalesData ? 'Market Value' : 'Estimated Value'}
                                </p>
                                {!hasSalesData && (
                                  <Badge variant="outline" className="text-xs">
                                    Estimate
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-3xl font-bold ${
                              item.card_details.price_trend_7d && item.card_details.price_trend_7d > 0
                                ? 'text-green-600'
                                : item.card_details.price_trend_7d && item.card_details.price_trend_7d < 0
                                ? 'text-red-600'
                                : 'text-foreground'
                            }`}>
                              ${Number(item.card_details.estimated_value).toFixed(2)}
                            </p>
                              {item.card_details.last_price_update && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Updated {format(new Date(item.card_details.last_price_update), 'MMM dd, h:mm a')}
                                </p>
                              )}
                              {!hasSalesData && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Based on card attributes • Click Refresh for live data
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        
                        {item.card_details.price_trend_7d !== null && item.card_details.price_trend_7d !== undefined && (
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">7-Day Trend</p>
                              <PriceTrend value={item.card_details.price_trend_7d} showIcon className="text-2xl" />
                            </CardContent>
                          </Card>
                        )}
                        
                        {item.card_details.last_sale_price && (
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Last Sale</p>
                              <p className="text-2xl font-bold">
                                ${Number(item.card_details.last_sale_price).toFixed(2)}
                              </p>
                              {item.card_details.last_sale_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(item.card_details.last_sale_date), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      {/* Average Market Value */}
                      {item.card_details.last_sale_price && item.card_details.estimated_value && (
                        <div className="flex items-center justify-center gap-8 p-4 bg-muted/20 rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Average Market</p>
                            <p className="text-xl font-semibold">
                              ${((Number(item.card_details.last_sale_price) + Number(item.card_details.estimated_value)) / 2).toFixed(2)}
                            </p>
                          </div>
                          <div className="h-8 w-px bg-border" />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Condition</p>
                            <p className="text-sm font-medium">
                              {item.card_details.is_graded 
                                ? `${item.card_details.grading_company} ${item.card_details.grade}`
                                : item.card_details.condition || 'Raw'}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <p className="text-muted-foreground mb-3">⚠️ Pricing data not available</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        This card hasn't been priced yet. Click below to fetch current market data.
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          try {
                            toast({
                              title: "Fetching market data...",
                              description: "Getting latest pricing from eBay"
                            });
                            
                            const { error } = await supabase.functions.invoke('fetch-card-pricing', {
                              body: { 
                                cardId: item.card_details?.id,
                                cardDetails: item.card_details,
                                force_refresh: true
                              }
                            });
                            if (error) throw error;
                            
                            toast({
                              title: "Market data loaded",
                              description: "Latest pricing and sales data available"
                            });
                            
                            // Invalidate recent sales query to refresh the component
                            queryClient.invalidateQueries({ queryKey: ['recent-sales', item.card_details?.id] });
                            
                            // Refresh to check for sales data
                            loadItem();
                          } catch (error: any) {
                            toast({
                              title: "Error fetching pricing",
                              description: error.message,
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Fetch Market Data
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Price History Charts */}
                {item.card_details.estimated_value && (
                  <div className="space-y-4">
                    <Tabs defaultValue="7d">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="7d">7 Days</TabsTrigger>
                        <TabsTrigger value="30d">30 Days</TabsTrigger>
                      </TabsList>
                      <TabsContent value="7d">
                        <PriceHistoryChart cardId={item.card_details.id!} days={7} />
                      </TabsContent>
                      <TabsContent value="30d">
                        <PriceHistoryChart cardId={item.card_details.id!} days={30} />
                      </TabsContent>
                    </Tabs>
                    
                    <RecentSales cardId={item.card_details.id!} />
                  </div>
                )}
                
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

            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ItemDetail;