import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Package, Trash2, Pencil, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageWithBoundingBoxes } from "@/components/ImageWithBoundingBoxes";
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

interface ItemDetails {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  acquired_date: string | null;
  cost: number | null;
  image_url: string | null;
  created_at: string;
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
          detections(label, confidence, bbox_x, bbox_y, bbox_width, bbox_height)
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
        })
        .eq("id", id);

      if (error) throw error;

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
        {item.image_url && item.detections && item.detections.length > 0 && (
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
        {item.image_url && (!item.detections || item.detections.length === 0) && (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full max-w-md mx-auto rounded-xl shadow-lg"
          />
        )}

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
              {item.category && (
                <Badge variant="secondary">{item.category}</Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Package className="h-5 w-5" />
                <span>Quantity: {item.quantity}</span>
              </div>

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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ItemDetail;