import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Loader2, X, Plus } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ImageWithBoundingBoxes } from "@/components/ImageWithBoundingBoxes";
import { CardDetailsForm } from "@/components/CardDetailsForm";
import { cropImageFromBoundingBox } from "@/lib/imageCropping";
import { useQueryClient } from "@tanstack/react-query";
import { trackMetaPixelEvent, MetaPixelEvents } from "@/lib/metaPixel";
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
    parallel_name: string;
    condition: string;
    is_graded: boolean;
    grading_company: string;
    grade: string;
    cert_number?: string;
    estimated_value: string;
    price_source?: string;
    special_attributes: string[];
  };
}

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    detections = [], 
    imageUrl = "", 
    imageUrls = [],
    originalImageUrls = [],
    croppedFrontUrls = [],
    croppedBackUrls = [],
    backImageUrl = null, // Back image URL for single card mode
    backImageFile = null // Back image file for single card mode
  } = location.state || {};
  
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
      const mappedItems = detections.map((d: any) => {
        // For sports cards, merge extracted cardDetails with defaults
        let cardDetails = {};
        if (userSource === 'sports-cards') {
          if (d.cardDetails) {
            // Use extracted cardDetails, ensuring all fields have defaults
            cardDetails = {
              player_name: d.cardDetails.player_name || '',
              card_year: d.cardDetails.card_year ? String(d.cardDetails.card_year) : '',
              brand: d.cardDetails.brand || '',
              set_name: d.cardDetails.set_name || '',
              sport: d.cardDetails.sport || '',
              card_number: d.cardDetails.card_number || '',
              parallel_name: d.cardDetails.parallel_name || '',
              condition: d.cardDetails.condition || '',
              is_graded: d.cardDetails.is_graded || false,
              grading_company: d.cardDetails.grading_company || '',
              grade: d.cardDetails.grade ? String(d.cardDetails.grade) : '',
              cert_number: d.cardDetails.cert_number || '',
              estimated_value: d.cardDetails.estimated_value ? String(d.cardDetails.estimated_value) : '',
              price_source: d.cardDetails.price_source || '',
              special_attributes: Array.isArray(d.cardDetails.special_attributes) ? d.cardDetails.special_attributes : [],
            };
            // Debug log to verify values are being set
            console.log('Review: Initializing cardDetails for', d.label, cardDetails);
          } else {
            // Fallback to empty structure if no cardDetails
            cardDetails = {
              player_name: '',
              card_year: '',
              brand: '',
              set_name: '',
              sport: '',
              card_number: '',
              parallel_name: '',
              condition: '',
              is_graded: false,
              grading_company: '',
              grade: '',
              cert_number: '',
              estimated_value: '',
              price_source: '',
              special_attributes: [],
            };
          }
        }
        
        return {
          ...d,
          name: d.label,
          category: "",
          quantity: 1,
          acquired_date: "",
          cost: "",
          ...(userSource === 'sports-cards' && { cardDetails })
        };
      });
      
      console.log('Review: Setting items with cardDetails', mappedItems);
      setItems(mappedItems);
    }

    loadLocations();
  }, [detections]);

  const loadLocations = async () => {
    try {
      const response = await api.get("/api/cards/collections/");
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
    if (data) {
      setLocations(data);
      if (data.length > 0) {
        setSelectedLocation(data[0].id);
      }
      }
    } catch (error) {
      console.error("Error loading collections:", error);
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
      return;
    }

    try {
      const response = await api.post("/api/cards/collections/", {
          name: newLocationName,
      });

      const newLocation = response.data;
      setLocations(prev => [newLocation, ...prev]);
      setSelectedLocation(newLocation.id);
      setNewLocationName("");
      setShowNewLocationDialog(false);
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error creating collection",
        description: error?.response?.data?.detail || error?.message || "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      toast({
        title: "Collection required",
        description: "Please select a collection to save items",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to save items",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check user limit before saving
      const limitResponse = await api.post('/api/cards/scans/check-limit/', {
        item_count: items.length
      });

      if (!limitResponse.data.can_add) {
        const planName = limitResponse.data.plan_tier 
          ? limitResponse.data.plan_tier.charAt(0).toUpperCase() + limitResponse.data.plan_tier.slice(1)
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

      // Get existing card count to determine if this is first save
      const existingCardsResponse = await api.get('/api/cards/cards/');
      const existingCards = Array.isArray(existingCardsResponse.data) 
        ? existingCardsResponse.data 
        : (existingCardsResponse.data.results || []);
      const isFirstSave = existingCards.length === 0;

      // Save all cards
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Use pre-cropped images from scan if available
        // For single card mode, use the back image passed from Scan page
        let frontImageUrl = croppedFrontUrls[i] || imageUrl;
        let backImageUrlToUse: string | null = null;
        
        // Priority: 1) Single card back image, 2) Cropped back URLs, 3) None
        if (backImageUrl && i === 0) {
          // Single card mode: use the back image passed from Scan page (only for first item)
          backImageUrlToUse = backImageUrl;
        } else if (source === 'sports-cards' && croppedBackUrls.length > i) {
          // Bulk mode: use cropped back URLs
          backImageUrlToUse = croppedBackUrls[i];
        }
        
        // Upload blob URLs to get proper URLs
        const uploadBlobUrl = async (blobUrl: string): Promise<string | null> => {
          if (!blobUrl || blobUrl.startsWith('http://') || blobUrl.startsWith('https://')) {
            // Already a valid URL
            return blobUrl;
          }
          
          if (blobUrl.startsWith('blob:')) {
            try {
              // Fetch blob as blob
              const response = await fetch(blobUrl);
              const blob = await response.blob();
              
              // Convert to base64
              const reader = new FileReader();
              const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onloadend = () => {
                  if (reader.result && typeof reader.result === 'string') {
                    resolve(reader.result);
                  } else {
                    reject(new Error('Failed to convert blob to base64'));
                  }
                };
                reader.onerror = reject;
              });
              reader.readAsDataURL(blob);
              
              const base64Data = await base64Promise;
              
              // Upload to backend
              const uploadResponse = await api.post('/api/cards/images/upload/', {
                image_data: base64Data
              });
              
              return uploadResponse.data.image_url;
            } catch (error) {
              console.error('Error uploading blob URL:', error);
              return null;
            }
          }
          
          return null;
        };
        
        // Upload images if they're blob URLs
        const uploadedFrontUrl = await uploadBlobUrl(frontImageUrl);
        const uploadedBackUrl = backImageUrlToUse ? await uploadBlobUrl(backImageUrlToUse) : null;
        
        // If we have a back image file from single card mode, upload it directly
        let finalBackImageUrl = uploadedBackUrl;
        if (!finalBackImageUrl && backImageFile && i === 0) {
          // Upload back image file directly for single card mode
          try {
            const backImageFormData = new FormData();
            backImageFormData.append('image', backImageFile);
            const backImageResponse = await api.post('/api/cards/images/upload/', backImageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            finalBackImageUrl = backImageResponse.data.image_url;
          } catch (backUploadError) {
            console.error('Error uploading back image:', backUploadError);
            // Continue without back image if upload fails
          }
        }
        
        if (!uploadedFrontUrl) {
          toast({
            title: "Image upload failed",
            description: "Could not upload front image. Please try again.",
            variant: "destructive",
          });
          continue;
        }
        
        // Prepare card data
        // Sync Card model fields from CardDetails
        const estimatedValue = item.cardDetails?.estimated_value 
          ? parseFloat(item.cardDetails.estimated_value) 
          : 0;
        
        const cardData: any = {
          name: item.name,
          player: item.cardDetails?.player_name || item.name || '',
          year: item.cardDetails?.card_year ? parseInt(item.cardDetails.card_year) : null,
          // Sync value from estimated_value (Card.value should match CardDetails.estimated_value)
          value: estimatedValue,
          // Sync grading from grade (Card.grading for display, CardDetails.grade for detailed info)
          grading: item.cardDetails?.is_graded && item.cardDetails?.grade
            ? `${item.cardDetails.grading_company || 'PSA'} ${item.cardDetails.grade}`
            : null,
          collection: selectedLocation,
          image_url: uploadedFrontUrl,
          back_image_url: finalBackImageUrl || uploadedBackUrl,
          cost: item.cost ? parseFloat(item.cost) : 0,
          acquired_date: item.acquired_date || null,
          special_attributes: item.cardDetails?.special_attributes || [],
          is_graded: item.cardDetails?.is_graded || false,
        };

        // Include card_details_data if this is a sports card
        // ALWAYS include card_details_data for sports cards, even if empty, to ensure CardDetails is created
        if (true) {
          cardData.card_details_data = {
            player_name: item.cardDetails?.player_name || '',
            card_year: item.cardDetails?.card_year ? parseInt(item.cardDetails.card_year) : null,
            brand: item.cardDetails?.brand || '',
            set_name: item.cardDetails?.set_name || '',
            sport: item.cardDetails?.sport || '',
            card_number: item.cardDetails?.card_number || '',
            parallel_name: item.cardDetails?.parallel_name || '',
            condition: item.cardDetails?.condition || '',
            is_graded: item.cardDetails?.is_graded || false,
            grading_company: item.cardDetails?.grading_company || '',
            grade: item.cardDetails?.grade ? String(item.cardDetails.grade) : '',
            cert_number: item.cardDetails?.cert_number || '',
            estimated_value: item.cardDetails?.estimated_value ? parseFloat(item.cardDetails.estimated_value) : 0,
            price_source: item.cardDetails?.price_source || '',
            special_attributes: item.cardDetails?.special_attributes || [],
          };
          console.log('Review: Sending card_details_data:', cardData.card_details_data);
        }

        // Create card (with nested card_details if provided)
        try {
          const cardResponse = await api.post('/api/cards/cards/', cardData);
          const createdCard = cardResponse.data;

          // Queue pricing update if card has details
          if (createdCard.id && item.cardDetails && source === 'sports-cards') {
            // Queue pricing fetch (non-blocking)
            api.post(`/api/cards/cards/${createdCard.id}/price/refresh/`).catch(err => 
              console.warn('Failed to queue pricing update:', err)
            );
          }
        } catch (saveError: any) {
          if (saveError?.response?.status === 409 && saveError?.response?.data?.duplicate) {
            // Duplicate cert_number
            const certNum = saveError.response.data.cert_number || 'this certification number';
            toast({
              title: "Card already exists",
              description: saveError.response.data.detail || `A card with certification number ${certNum} already exists in your collection`,
              variant: "default",
            });
            continue; // Skip this card
          } else {
            throw saveError; // Re-throw other errors
          }
        }
      }

      // Invalidate queries to refresh dashboard and subscription page in real-time
      queryClient.invalidateQueries({ queryKey: ['dashboard-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-locations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-card-stats'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      
      // Track Pixel events
      if (isFirstSave) {
        trackMetaPixelEvent(MetaPixelEvents.FirstScan, {
          content_name: 'First Card Scan',
          content_category: 'User Milestone',
          num_items: items.length
        });
        
        // Email notifications are now handled by the backend
      }
      
      // Track AddToCollection event
      trackMetaPixelEvent(MetaPixelEvents.AddToCollection, {
        content_name: 'Add Cards to Collection',
        content_category: 'Card Management',
        num_items: items.length,
        collection_id: selectedLocation
      });
      
      toast({
        title: "Success!",
        description: isFirstSave 
          ? `🎉 Congratulations! You've saved your first ${items.length} card${items.length > 1 ? 's' : ''}!`
          : `Successfully saved ${items.length} card${items.length > 1 ? 's' : ''}`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving items:", error);
      toast({
        title: "Error saving items",
        description: error?.response?.data?.detail || error?.message || "Failed to save items. Please try again.",
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
        {/* Show original full scan images for sports cards */}
        {source === 'sports-cards' && originalImageUrls.length >= 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-muted-foreground">Front</p>
              <img
                src={originalImageUrls[0]}
                alt="All Cards Front"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-muted-foreground">Back</p>
              <img
                src={originalImageUrls[1]}
                alt="All Cards Back"
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

                {/* Show cropped card images */}
                {source === 'sports-cards' && (croppedFrontUrls[index] || croppedBackUrls[index]) && (
                  <div className="grid grid-cols-2 gap-4">
                    {croppedFrontUrls[index] && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-center text-muted-foreground">Front</p>
                        <img
                          src={croppedFrontUrls[index]}
                          alt={`${item.name} - Front`}
                          className="w-full rounded-lg shadow-md"
                        />
                      </div>
                    )}
                    {croppedBackUrls[index] && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-center text-muted-foreground">Back</p>
                        <img
                          src={croppedBackUrls[index]}
                          alt={`${item.name} - Back`}
                          className="w-full rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                )}

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
              Collection Name
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