import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, QrCode, Search, Sparkles } from "lucide-react";
import { PREDEFINED_LOCATIONS, SPORTS_COLLECTIONS } from "@/lib/locationTypes";
import { trackMetaPixelEvent, MetaPixelEvents } from "@/lib/metaPixel";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, checkAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [locationName, setLocationName] = useState("");
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(true);
  const [source, setSource] = useState("");

  useEffect(() => {
    // Verify user is authenticated before showing onboarding
    const verifyAuth = async () => {
      if (!authLoading) {
        if (!isAuthenticated) {
          // Try to check auth one more time
          const token = localStorage.getItem('access_token');
          if (token) {
            const authed = await checkAuth();
            if (authed) {
              setChecking(false);
              return;
            }
          }
          // No token or auth failed - redirect to login
          navigate("/auth", { replace: true });
          return;
        }
        // Authenticated - show onboarding
        setChecking(false);
      }
    };
    verifyAuth();

    // Get source from sessionStorage
    const userSource = sessionStorage.getItem('user_source') || '';
    setSource(userSource);
  }, [navigate, isAuthenticated, authLoading, checkAuth]);

  const handleCreateLocation = async () => {
    if (!locationName.trim()) {
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Create a collection using Django API
      const response = await api.post("/api/cards/collections/", {
        name: locationName,
      });

      if (response.status !== 201 && response.status !== 200) {
        throw new Error("Failed to create collection");
      }

      // Track onboarding completion as a lead
      trackMetaPixelEvent(MetaPixelEvents.Lead, {
        content_name: 'Onboarding Complete',
        content_category: 'User Milestone'
      });

      // Mark onboarding as completed
      sessionStorage.setItem('onboarding_completed', 'true');
      
      setStep(3);
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.message || "Failed to create collection",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSkipToApp = async () => {
    // Mark onboarding as completed (even if skipped) to prevent loop
    sessionStorage.setItem('onboarding_completed', 'true');
    // Give a moment for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    navigate("/dashboard", { replace: true });
  };

  if (checking || authLoading) {
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
              <CardTitle className="text-3xl">
                {source === 'sports-cards' ? 'Welcome, Collector! 🏆' : 'Welcome to Cubby! 🎉'}
              </CardTitle>
              <CardDescription className="text-lg">
                {source === 'sports-cards' 
                  ? "Let's set up your card collection in 3 steps"
                  : "Let's get you set up in just a few steps"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {source === 'sports-cards' ? 'Organize by Collection' : 'Organize by Location'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {source === 'sports-cards' 
                        ? 'Create collections like "Baseball Cards", "Rookie Cards", or "Graded Cards"'
                        : 'Create locations like "Garage", "Kitchen", or "Storage Unit" to organize your items'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {source === 'sports-cards' ? 'AI Detection of Players & Cards' : 'AI-Powered Scanning'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {source === 'sports-cards' 
                        ? 'Our AI identifies players, years, brands, and grades automatically'
                        : 'Take a photo and our AI automatically detects and catalogs all your items'
                      }
                    </p>
                  </div>
                </div>

                {source === 'sports-cards' ? (
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Track Condition & Values</h3>
                      <p className="text-sm text-muted-foreground">
                        Record card conditions, grading info, and estimated values
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <QrCode className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">QR Code Labels</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate and print QR codes for quick access to your inventory from anywhere
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Search className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {source === 'sports-cards' ? 'Search by Player, Year, or Set' : 'Instant Search'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {source === 'sports-cards' 
                        ? 'Find any card instantly by player, team, year, or brand'
                        : 'Find any item in seconds across all your locations'
                      }
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
              <CardTitle className="text-2xl">
                {source === 'sports-cards' ? 'Create Your First Collection' : 'Create Your First Location'}
              </CardTitle>
              <CardDescription>
                {source === 'sports-cards' 
                  ? 'Start by creating a collection to organize your cards'
                  : 'Start by creating a location where you\'ll store items'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location-name">
                  Collection Name
                </Label>
                <Input
                  id="location-name"
                  placeholder={source === 'sports-cards' 
                    ? 'e.g., Baseball Cards, Rookie Cards, Graded Cards...'
                    : 'e.g., Garage, Kitchen, Storage Unit...'
                  }
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateLocation()}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(source === 'sports-cards' 
                    ? SPORTS_COLLECTIONS.slice(0, 6)
                    : PREDEFINED_LOCATIONS.slice(0, 6)
                  ).map((locationType) => {
                    const IconComponent = locationType.icon;
                    const emoji = 'emoji' in locationType ? locationType.emoji : undefined;
                    return (
                      <Button
                        key={locationType.id}
                        variant="outline"
                        className="h-auto py-3 flex flex-col items-center gap-2"
                        onClick={() => setLocationName(locationType.name)}
                      >
                        {emoji ? (
                          <span className="text-2xl">{emoji}</span>
                        ) : (
                          <IconComponent className="h-4 w-4" />
                        )}
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
                  {creating ? "Creating..." : `Create ${source === 'sports-cards' ? 'Collection' : 'Location'}`}
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
              <CardTitle className="text-2xl">
                {source === 'sports-cards' ? "You're Ready to Catalog! 🏆" : "You're All Set! 🎊"}
              </CardTitle>
              <CardDescription>
                {source === 'sports-cards' 
                  ? 'Your collection has been created. Here\'s how to build your digital card catalog:'
                  : 'Your location has been created. Here\'s what to do next:'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="font-semibold">
                      {source === 'sports-cards' ? 'Scan Your Cards' : 'Scan Your First Items'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">
                    {source === 'sports-cards' 
                      ? 'Take photos of your cards - spread them out for best results. Our AI identifies players, years, brands, and more!'
                      : 'Use the camera button to take a photo of items you want to catalog. Our AI will detect everything automatically!'
                    }
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="font-semibold">
                      {source === 'sports-cards' ? 'Add Card Details' : 'Generate QR Codes'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">
                    {source === 'sports-cards' 
                      ? 'Record conditions, grading info, and estimated values for each card'
                      : 'Print QR code labels for your locations for quick mobile access from anywhere'
                    }
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="font-semibold">
                      {source === 'sports-cards' ? 'Track Your Collection' : 'Search & Organize'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">
                    {source === 'sports-cards' 
                      ? 'Search by player name, year, team, or brand to find any card instantly'
                      : 'Use the search feature to find any item instantly across all your locations'
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => navigate("/scan")} 
                  className="w-full" 
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  {source === 'sports-cards' ? 'Scan Your First Cards' : 'Scan Your First Items Now'}
                </Button>
                <Button 
                  onClick={handleSkipToApp} 
                  variant="ghost" 
                  className="w-full"
                  size="sm"
                >
                  I'll do this later
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {source === 'sports-cards' 
                  ? 'Free tier includes 10 cards total • Upgrade anytime for unlimited'
                  : 'Free tier includes 10 cards total • Upgrade anytime for more'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
