import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Loader2, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageWithBoundingBoxes } from "@/components/ImageWithBoundingBoxes";
import { CardDetailsForm } from "@/components/CardDetailsForm";
import { cropImageFromBoundingBox } from "@/lib/imageCropping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Detection {
  label: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ReviewItem extends Detection {
  name: string;
  category: string;
  quantity: number;
  acquired_date: string;
  cost: string;
  cardDetails?: {
    player_name: string;
    card_year: string;
    brand: string;
    set_name: string;
    sport: string;
    card_number: string;
    condition: string;
    is_graded: boolean;
    grading_company: string;
    grade: string;
    estimated_value: string;
    special_attributes: string[];
  };
}

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { detections = [], imageUrl = "", imageUrls = [] } = location.state || {};
  
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNewLocationDialog, setShowNewLocationDialog] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    const userSource = sessionStorage.getItem('user_source') || '';
    setSource(userSource);

    if (detections.length > 0) {
      setItems(
        detections.map((d: any) => ({
          ...d,
          name: d.label,
          category: "",
          quantity: 1,
          acquired_date: "",
          cost: "",
          // Use AI-extracted card details if available, otherwise create empty structure
          ...(userSource === 'sports-cards' && {
            cardDetails: d.cardDetails || {
              player_name: '',
              card_year: '',
              brand: '',
              set_name: '',
              sport: '',
              card_number: '',
              condition: '',
              is_graded: false,
              grading_company: '',
              grade: '',
              estimated_value: '',
              special_attributes: [],
            }
          })
        }))
      );
    }

    loadLocations();
  }, [detections]);

  const loadLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("id, name, user_id, created_at")
      .order("created_at", { ascending: false });
    
    if (data) {
      setLocations(data);
      if (data.length > 0) {
        setSelectedLocation(data[0].id);
      }
    }
  };

  const updateItem = (index: number, field: keyof ReviewItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) {
      toast({
        title: "Please enter a location name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: newLocation, error } = await supabase
        .from("locations")
        .insert({
          user_id: user.id,
          name: newLocationName,
        })
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => [newLocation, ...prev]);
      setSelectedLocation(newLocation.id);
      setNewLocationName("");
      setShowNewLocationDialog(false);
      
      toast({
        title: "Location created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error creating location",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      toast({
        title: "Please select a location",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if this is the user's first save
      const { count: existingItemCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const isFirstSave = existingItemCount === 0;

      // Increment item usage
      const { data: incremented, error: incrementError } = await supabase.rpc(
        'increment_item_usage',
        { 
          p_user_id: user.id,
          p_item_count: items.length
        }
      );

      if (incrementError || !incremented) {
        // Check if user has a subscription to provide better error message
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('plan_tier')
          .eq('user_id', user.id)
          .single();
        
        const planName = subData?.plan_tier 
          ? subData.plan_tier.charAt(0).toUpperCase() + subData.plan_tier.slice(1)
          : 'Free';
        
        toast({
          title: "Item limit reached",
          description: `Your ${planName} plan doesn't have enough items remaining for ${items.length} new items. Upgrade or remove existing items to continue.`,
          variant: "destructive",
        });
        setSaving(false);
        navigate('/subscription');
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // For sports cards with multiple images: 
        // - If 2 images total: [0]=front, [1]=back
        // - If 2N images for N cards: first N images are fronts, second N images are backs
        const isSportsCard = source === 'sports-cards';
        const totalImages = imageUrls.length || 1;
        const numCards = items.length;
        
        let frontImageUrl = imageUrl; // default to single image
        let backImageUrl = null;
        
        if (isSportsCard && totalImages >= 2) {
          if (numCards === 1) {
            // Single card: first image is front, second is back
            frontImageUrl = imageUrls[0];
            backImageUrl = imageUrls[1];
          } else {
            // Multiple cards: first half are fronts, second half are backs
            const halfPoint = Math.floor(totalImages / 2);
            frontImageUrl = imageUrls[i] || imageUrls[0];
            backImageUrl = imageUrls[halfPoint + i] || null;
          }
        }

        // Crop individual card from full scan image if bbox available
        const detectionForCrop = detections.find(d => d.label === item.label);
        if (detectionForCrop?.bbox && frontImageUrl) {
          try {
            const croppedBlob = await cropImageFromBoundingBox(frontImageUrl, detectionForCrop.bbox);
            const fileName = `${user.id}/${Date.now()}_${i}_cropped.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from("item-images")
              .upload(fileName, croppedBlob, {
                contentType: "image/jpeg",
                upsert: false,
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from("item-images")
                .getPublicUrl(fileName);
              frontImageUrl = publicUrl;
            }
          } catch (cropError) {
            console.error("Failed to crop image:", cropError);
            // Fall back to original image URL
          }
        }
        
        const { data: insertedItem, error: itemError } = await supabase
          .from("items")
          .insert({
            user_id: user.id,
            location_id: selectedLocation,
            name: item.name,
            category: item.category || null,
            quantity: item.quantity,
            acquired_date: item.acquired_date || null,
            cost: item.cost ? parseFloat(item.cost) : null,
            image_url: frontImageUrl,
            back_image_url: backImageUrl,
            source_context: source || null,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Save card details if this is a sports card
        if (item.cardDetails && source === 'sports-cards') {
          await supabase.from("card_details").insert({
            item_id: insertedItem.id,
            player_name: item.cardDetails.player_name || null,
            card_year: item.cardDetails.card_year ? parseInt(item.cardDetails.card_year) : null,
            brand: item.cardDetails.brand || null,
            set_name: item.cardDetails.set_name || null,
            sport: item.cardDetails.sport || null,
            card_number: item.cardDetails.card_number || null,
            condition: item.cardDetails.condition || null,
            is_graded: item.cardDetails.is_graded,
            grading_company: item.cardDetails.is_graded ? item.cardDetails.grading_company : null,
            grade: item.cardDetails.is_graded && item.cardDetails.grade ? parseFloat(item.cardDetails.grade) : null,
            estimated_value: item.cardDetails.estimated_value ? parseFloat(item.cardDetails.estimated_value) : null,
            special_attributes: item.cardDetails.special_attributes,
          });
        }

        // Save detection data with bounding boxes
        await supabase.from("detections").insert({
          item_id: insertedItem.id,
          label: item.label,
          confidence: item.confidence,
          bbox_x: detectionForCrop?.bbox?.x || null,
          bbox_y: detectionForCrop?.bbox?.y || null,
          bbox_width: detectionForCrop?.bbox?.width || null,
          bbox_height: detectionForCrop?.bbox?.height || null,
        });
      }

      // Send first save congratulations email
      if (isFirstSave) {
        try {
          await supabase.functions.invoke('send-first-save-email', {
            body: { 
              email: user.email,
              name: user.email?.split('@')[0],
              userId: user.id,
              itemCount: items.length
            }
          });
        } catch (emailError) {
          console.error('Failed to send first save email:', emailError);
          // Don't fail the save if email fails
        }
      }

      toast({ title: `${items.length} items saved successfully!` });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error saving items",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (detections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No items detected</p>
          <Button onClick={() => navigate("/scan")}>Try Again</Button>
        </div>
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
            <h1 className="text-xl font-bold">Review Items</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Show front and back images for sports cards */}
        {source === 'sports-cards' && imageUrls.length >= 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-muted-foreground">Front</p>
              <img
                src={imageUrls[0]}
                alt="Card Front"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-muted-foreground">Back</p>
              <img
                src={imageUrls[1]}
                alt="Card Back"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
          </div>
        ) : imageUrl ? (
          <div className="flex justify-center">
            <ImageWithBoundingBoxes 
              imageUrl={imageUrl} 
              detections={detections}
              className="w-full max-w-2xl"
            />
          </div>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>{source === 'sports-cards' ? 'Collection' : 'Location'}</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder={source === 'sports-cards' ? 'Select collection' : 'Select location'} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 font-normal"
                    onClick={() => setShowNewLocationDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {source === 'sports-cards' ? 'Create New Collection' : 'Create New Location'}
                  </Button>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      placeholder="Optional"
                      value={item.category}
                      onChange={(e) => updateItem(index, "category", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Acquired Date (Optional)</Label>
                    <Input
                      type="date"
                      value={item.acquired_date}
                      onChange={(e) => updateItem(index, "acquired_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost (Optional)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.cost}
                      onChange={(e) => updateItem(index, "cost", e.target.value)}
                    />
                  </div>
                </div>

                {source === 'sports-cards' && item.cardDetails && (
                  <CardDetailsForm
                    details={item.cardDetails}
                    onChange={(details) => updateItem(index, 'cardDetails', details)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={showNewLocationDialog} onOpenChange={setShowNewLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {source === 'sports-cards' ? 'Create New Collection' : 'Create New Location'}
            </DialogTitle>
            <DialogDescription>
              {source === 'sports-cards' 
                ? 'Add a new collection to organize your cards.'
                : 'Add a new location to organize your items.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="location-name">
              {source === 'sports-cards' ? 'Collection Name' : 'Location Name'}
            </Label>
            <Input
              id="location-name"
              placeholder={source === 'sports-cards' 
                ? 'e.g., Baseball Cards, Rookie Cards, Vintage Collection'
                : 'e.g., Kitchen, Garage, Bedroom'
              }
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateLocation();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewLocationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLocation}>
              {source === 'sports-cards' ? 'Create Collection' : 'Create Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Review;