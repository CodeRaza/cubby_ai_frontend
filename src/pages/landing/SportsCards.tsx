import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { useNavigate } from "react-router-dom";
import { Camera, Search, Grid, Trophy, ChevronRight, Star, Shield, TrendingUp, Scan, BarChart3, Filter, Tag, Lock, Bell, Box } from "lucide-react";

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
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in">
              Turn Your Sports Cards Into a Smart Portfolio 📈
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Scan your cards in seconds. Track their value. Never lose a piece of your collection again.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg" 
                className="text-lg h-14 px-8"
                onClick={() => navigate('/auth?mode=signup&source=sports-cards')}
              >
                Start Free — Scan Your Cards
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg h-14 px-8"
                onClick={() => scrollToSection('how-it-works')}
              >
                Watch How It Works
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span>Free to start</span>
              <span className="text-border">•</span>
              <span>Private & secure</span>
              <span className="text-border">•</span>
              <span>Real-time values</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Still digging through boxes to find that one card?</h2>
            <p className="text-lg text-muted-foreground">
              Hours wasted logging cards. Lost value. Missed opportunities. Your collection deserves better.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth?mode=signup&source=sports-cards')}
            >
              Get Organized in Minutes
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary mx-auto flex items-center justify-center">
                <Scan className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Scan</h3>
              <p className="text-muted-foreground">
                Snap a photo — our AI identifies the card instantly.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary mx-auto flex items-center justify-center">
                <Box className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Organize</h3>
              <p className="text-muted-foreground">
                Sort by player, set, year, condition & value.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary mx-auto flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Track</h3>
              <p className="text-muted-foreground">
                Monitor your collection's value in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Smart Detection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scan className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">🃏 Smart Detection</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li>• All sports supported</li>
                <li>• Player, year & set recognition</li>
                <li>• Condition & grading tracking</li>
              </ul>
            </div>

            {/* Real-Time Value Tracking */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">📊 Value Tracking</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Automatic valuations</li>
                <li>• Portfolio statistics</li>
                <li>• Price alerts</li>
              </ul>
            </div>

            {/* Powerful Organization */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">🔍 Organization</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Advanced filters</li>
                <li>• Custom tags</li>
                <li>• Secure cloud storage</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3 hover-scale">
              <h3 className="font-bold text-lg">Personal Collections</h3>
              <p className="text-sm text-muted-foreground">
                Manage thousands of cards effortlessly.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3 hover-scale">
              <h3 className="font-bold text-lg">Trading & Selling</h3>
              <p className="text-sm text-muted-foreground">
                Know exactly what you have and what it's worth.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3 hover-scale">
              <h3 className="font-bold text-lg">Inheritance Management</h3>
              <p className="text-sm text-muted-foreground">
                Catalog inherited collections with ease.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3 hover-scale">
              <h3 className="font-bold text-lg">Investment Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor portfolio performance over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Join thousands of collectors getting organized with Cubby.
            </h2>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-xl h-16 px-12"
              onClick={() => navigate('/auth?mode=signup&source=sports-cards')}
            >
              Start Free Today
            </Button>
            <p className="text-sm opacity-90">
              No credit card required · 50 free scans per month
            </p>
            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="flex items-center gap-2 opacity-90">
                <Lock className="h-5 w-5" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2 opacity-90">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-sm">5-Star Rated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
