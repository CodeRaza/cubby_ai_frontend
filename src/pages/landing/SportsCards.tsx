import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { useNavigate } from "react-router-dom";
import { Camera, Search, Grid, Trophy, ChevronRight, Star, Shield, TrendingUp } from "lucide-react";

export default function SportsCards() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Trophy className="h-4 w-4" />
                  For Serious Collectors
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Never Lose Track of Your{" "}
                <span className="text-primary">Card Collection</span> Again
              </h1>
              
              <p className="text-xl text-muted-foreground">
                AI-powered inventory for sports card collectors. Instantly catalog, organize, and find any card in your collection.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg h-14 px-8"
                  onClick={() => navigate('/auth?mode=signup&source=sports-cards')}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Start Building Your Digital Collection
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg h-14 px-8"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  See How It Works
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Secure storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Track values</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
                <img 
                  src="/cubby-favicon.png" 
                  alt="Sports Cards Collection" 
                  className="w-full rounded-lg"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">1986 Fleer Michael Jordan</span>
                    <span className="text-xs text-primary">Detected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">2020 Panini Prizm Tom Brady</span>
                    <span className="text-xs text-primary">Detected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">PSA 10 Derek Jeter Rookie</span>
                    <span className="text-xs text-primary">Detected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-3xl font-bold">Stop Losing Track of Your Cards</h2>
            <p className="text-lg text-muted-foreground">
              Hours spent manually logging cards, searching through boxes for that one card, 
              or buying duplicates because you forgot what you own. Sound familiar?
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Three Simple Steps to Digital Collection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your physical collection into a searchable digital inventory in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">1. Scan</h3>
                  <p className="text-muted-foreground">
                    Lay out your cards and snap a photo. Our AI identifies players, years, and brands instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Grid className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">2. Organize</h3>
                  <p className="text-muted-foreground">
                    Add details like condition, grade, and value. Sort by player, team, year, or set.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">3. Find Instantly</h3>
                  <p className="text-muted-foreground">
                    Search your entire collection in seconds. Find exactly what you need for trades or sales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Collectors, By Collectors
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">All Major Sports</h3>
                  <p className="text-sm text-muted-foreground">
                    Baseball, Basketball, Football, Hockey - we detect them all
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Player & Year Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically identifies player names, card years, and sets
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Condition Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track card condition and grading information (PSA, BGS, CGC)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Value Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Track estimated values and monitor your collection's worth
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Advanced Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Filter by sport, player, year, set, condition, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Grid className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Special Attributes</h3>
                  <p className="text-sm text-muted-foreground">
                    Mark rookie cards, autographs, jersey cards, and numbered editions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect For Every Collector
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h3 className="font-bold">Personal Collections</h3>
              <p className="text-sm text-muted-foreground">
                Manage your 5,000+ card collection effortlessly
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h3 className="font-bold">Trading & Selling</h3>
              <p className="text-sm text-muted-foreground">
                Quickly find cards to complete trades or list for sale
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h3 className="font-bold">Inheritance Management</h3>
              <p className="text-sm text-muted-foreground">
                Catalog inherited collections with ease
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h3 className="font-bold">Investment Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your portfolio value over time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Organize Your Collection?
            </h2>
            <p className="text-lg opacity-90">
              Join collectors who are already digitizing their sports card collections
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg h-14 px-8"
                onClick={() => navigate('/auth?mode=signup&source=sports-cards')}
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Free Today
              </Button>
            </div>
            <p className="text-sm opacity-75">
              Free tier includes 50 items per month • No credit card required
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
