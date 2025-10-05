import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Detection {
  label: string;
  confidence: number;
}

interface ReviewItem extends Detection {
  name: string;
  category: string;
  quantity: number;
  expiry_date: string;
}

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { detections = [], imageUrl = "" } = location.state || {};
  
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (detections.length > 0) {
      setItems(
        detections.map((d: Detection) => ({
          ...d,
          name: d.label,
          category: "",
          quantity: 1,
          expiry_date: "",
        }))
      );
    }

    loadLocations();
  }, [detections]);

  const loadLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setLocations(data);
      if (data.length > 0) {
        setSelectedLocation(data[0].id);
      }
    }
  };

  const updateItem = (index: number, field: keyof ReviewItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
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

      for (const item of items) {
        const { data: insertedItem, error: itemError } = await supabase
          .from("items")
          .insert({
            user_id: user.id,
            location_id: selectedLocation,
            name: item.name,
            category: item.category || null,
            quantity: item.quantity,
            expiry_date: item.expiry_date || null,
            image_url: imageUrl,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Save detection data
        await supabase.from("detections").insert({
          item_id: insertedItem.id,
          label: item.label,
          confidence: item.confidence,
        });
      }

      toast({ title: "Items saved successfully!" });
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
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Scanned" 
            className="w-full max-w-md mx-auto rounded-xl shadow-md"
          />
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
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
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.confidence * 100)}% confidence
                  </span>
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

                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) => updateItem(index, "expiry_date", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Review;