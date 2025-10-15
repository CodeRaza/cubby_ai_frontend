import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { useNavigate } from "react-router-dom";
import { Camera, Search, Trophy, ChevronRight, Star, Shield, TrendingUp, Scan, BarChart3, Filter, Lock, Box, Brain, Sparkles, Award } from "lucide-react";
import heroImage from "@/assets/hero-sports-dashboard.png";

export default function SportsCards() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Turn Your Sports Cards Into a Smart Portfolio
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Scan your cards in seconds. Track their market value automatically. Never lose a piece of your collection again.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg h-14 px-8 hover-scale"
                  onClick={() => navigate('/auth?mode=signup&source=sports-cards')}
                >
                  Start Free — Scan Your Cards
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg h-14 px-8 hover-scale"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  Watch How It Works
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Free to start</span>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Private & secure</span>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Real-time values</span>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <img 
                src={heroImage}
                alt="Cubby Sports Card Portfolio Dashboard"
                className="w-full h-auto rounded-lg shadow-2xl hover-scale"
              />
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
            <div className="text-center space-y-4 group">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all group-hover:scale-110">
                <Camera className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Scan</h3>
              <p className="text-muted-foreground">
                Snap a photo — our AI identifies the card instantly.
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all group-hover:scale-110">
                <Box className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Organize</h3>
              <p className="text-muted-foreground">
                Sort by player, set, year, condition & value.
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all group-hover:scale-110">
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
            <div className="space-y-6 group">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Smart Detection</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>All sports supported</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Player, year & set recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Condition & grading tracking</span>
                </li>
              </ul>
            </div>

            {/* Real-Time Value Tracking */}
            <div className="space-y-6 group">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Value Tracking</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Automatic valuations</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Portfolio statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Price alerts</span>
                </li>
              </ul>
            </div>

            {/* Powerful Organization */}
            <div className="space-y-6 group">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Organization</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Search className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Advanced filters</span>
                </li>
                <li className="flex items-start gap-2">
                  <Box className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Custom tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Secure cloud storage</span>
                </li>
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
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Join thousands of collectors who've turned their boxes into smart portfolios.
            </h2>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-xl h-16 px-12 hover-scale shadow-xl"
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
