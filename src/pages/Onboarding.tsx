import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, QrCode, Search, Sparkles } from "lucide-react";
import { PREDEFINED_LOCATIONS } from "@/lib/locationTypes";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [locationName, setLocationName] = useState("");
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verify user is authenticated before showing onboarding
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setChecking(false);
    };
    checkAuth();
  }, [navigate]);

  const handleCreateLocation = async () => {
    if (!locationName.trim()) {
      toast({
        title: "Location name required",
        description: "Please enter a name for your first location",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("locations").insert({
        name: locationName,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Location created!" });
      setStep(3);
    } catch (error: any) {
      toast({
        title: "Error creating location",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSkipToApp = async () => {
    // Give a moment for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    navigate("/dashboard", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome to Cubby! 🎉</CardTitle>
              <CardDescription className="text-lg">
                Let's get you set up in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Organize by Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Create locations like "Garage", "Kitchen", or "Storage Unit" to organize your items
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">AI-Powered Scanning</h3>
                    <p className="text-sm text-muted-foreground">
                      Take a photo and our AI automatically detects and catalogs all your items
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <QrCode className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">QR Code Labels</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate and print QR codes for quick access to your inventory from anywhere
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Search className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Instant Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Find any item in seconds across all your locations
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your First Location</CardTitle>
              <CardDescription>
                Start by creating a location where you'll store items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location-name">Location Name</Label>
                <Input
                  id="location-name"
                  placeholder="e.g., Garage, Kitchen, Storage Unit..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateLocation()}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PREDEFINED_LOCATIONS.slice(0, 6).map((locationType) => {
                    const IconComponent = locationType.icon;
                    return (
                      <Button
                        key={locationType.id}
                        variant="outline"
                        className="h-auto py-3 flex flex-col items-center gap-2"
                        onClick={() => setLocationName(locationType.name)}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-xs">{locationType.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSkipToApp}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleCreateLocation}
                  disabled={!locationName.trim() || creating}
                  className="flex-1"
                >
                  {creating ? "Creating..." : "Create Location"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">You're All Set! 🎊</CardTitle>
              <CardDescription>
                Your location has been created. Here's what to do next:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="font-semibold">Scan Your First Items</h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">
                    Use the camera button to take a photo of items you want to catalog. Our AI will detect everything automatically!
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="font-semibold">Generate QR Codes</h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">
                    Print QR code labels for your locations for quick mobile access from anywhere
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="font-semibold">Search & Organize</h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">
                    Use the search feature to find any item instantly across all your locations
                  </p>
                </div>
              </div>

              <Button onClick={handleSkipToApp} className="w-full" size="lg">
                Go to Dashboard
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Free tier includes 50 items per month • Upgrade anytime for more
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
