import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Sparkles, 
  Search, 
  Box, 
  Home, 
  Truck, 
  Store, 
  Shield,
  ArrowRight,
  Check
} from "lucide-react";
import cubbyLogo from "@/assets/cubby-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={cubbyLogo} alt="Cubby" className="h-10 w-10" />
              <span className="text-2xl font-bold text-foreground">Cubby</span>
            </div>
            <Button 
              size="lg" 
              className="rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/auth')}
            >
              Start Scanning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <Badge variant="secondary" className="text-sm px-4 py-2 font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Organization
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Find anything in seconds.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-primary">
                Just scan it with Cubby.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Take a picture of your pantry, garage, or storage — Cubby automatically 
              tags and organizes everything for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all"
                onClick={() => navigate('/auth')}
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning Free
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 rounded-full font-semibold"
                onClick={() => scrollToSection('how-it-works')}
              >
                See how it works
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Your photos stay private and secure</span>
            </div>
          </div>

          <div className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8">
              <div className="bg-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Scanning...</p>
                    <p className="text-sm text-muted-foreground">3 items detected</p>
                  </div>
                </div>
                
                {['Power Drill', 'Paint Brushes', 'Screwdriver Set'].map((item, i) => (
                  <div 
                    key={item}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl animate-fade-in-up"
                    style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Box className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Garage
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-float" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to never lose anything again
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Camera,
                step: "1",
                title: "Scan or Upload Photos",
                description: "Take a picture of any shelf, box, or bin. Works with your phone or tablet.",
              },
              {
                icon: Sparkles,
                step: "2",
                title: "Cubby Organizes It",
                description: "AI recognizes and tags each item with its location automatically.",
              },
              {
                icon: Search,
                step: "3",
                title: "Find It Instantly",
                description: "Search 'drill,' 'toilet paper,' or 'holiday lights' — Cubby tells you where it is.",
              },
            ].map((item, index) => (
              <Card 
                key={index}
                className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary text-white text-2xl font-bold mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <div className="h-12 w-12 mx-auto mb-4 text-primary">
                    <item.icon className="h-full w-full" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 rounded-full font-semibold shadow-xl"
              onClick={() => navigate('/auth')}
            >
              Start Organizing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              The easiest way to track what you own
            </h2>
            <p className="text-xl text-muted-foreground">
              Snap. Tag. Find.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Search,
                title: "Never lose things again",
                description: "Find anything in seconds with smart search",
                color: "text-primary",
              },
              {
                icon: Sparkles,
                title: "Smart visual memory",
                description: "Cubby remembers what's in every photo",
                color: "text-secondary",
              },
              {
                icon: Camera,
                title: "No manual sorting",
                description: "Just snap and done — AI handles the rest",
                color: "text-accent",
              },
            ].map((item, index) => (
              <Card 
                key={index}
                className="hover:shadow-xl transition-all duration-300 group"
              >
                <CardContent className="pt-8 pb-6">
                  <div className={`h-14 w-14 mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-full w-full" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6 rounded-full font-semibold"
              onClick={() => navigate('/auth')}
            >
              Try Cubby Free
            </Button>
          </div>
        </div>
      </section>

      {/* Use Case Grid */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Perfect for every space</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Home,
                title: "Pantry",
                description: "Know what's running low at a glance",
                gradient: "from-primary/10 to-primary/5",
              },
              {
                icon: Box,
                title: "Garage",
                description: "Find tools without digging through bins",
                gradient: "from-secondary/10 to-secondary/5",
              },
              {
                icon: Truck,
                title: "Moving",
                description: "Label boxes visually, not with tape",
                gradient: "from-accent/10 to-accent/5",
              },
              {
                icon: Store,
                title: "Small Business",
                description: "Track stockrooms and backrooms easily",
                gradient: "from-primary/10 to-accent/5",
              },
            ].map((useCase, index) => (
              <Card 
                key={index}
                className={`bg-gradient-to-br ${useCase.gradient} border-0 hover:shadow-xl transition-all duration-300 group cursor-pointer`}
                onClick={() => navigate('/auth')}
              >
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="h-12 w-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                    <useCase.icon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            
            <CardContent className="py-16 px-8 text-center relative z-10">
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Ready to find everything you own?
                </h2>
                
                <p className="text-xl text-white/90">
                  Join thousands of organized homes and never lose track of your belongings again
                </p>

                <Button 
                  size="lg"
                  variant="secondary"
                  className="text-lg px-10 py-7 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all text-primary"
                  onClick={() => navigate('/auth')}
                >
                  <Camera className="mr-2 h-6 w-6" />
                  Start Scanning Free
                </Button>

                <p className="text-sm text-white/80">
                  Works on iPhone, Android, and web • No credit card required
                </p>

                <div className="flex flex-wrap justify-center gap-6 pt-4">
                  {[
                    'Free forever plan',
                    '10 scans/month',
                    'AI-powered tagging',
                    'Multi-device sync',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-white/90">
                      <Check className="h-5 w-5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={cubbyLogo} alt="Cubby" className="h-8 w-8" />
              <span className="text-xl font-bold">Cubby</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Your photos stay private and secure</span>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 Cubby. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
