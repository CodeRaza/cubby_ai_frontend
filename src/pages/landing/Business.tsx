import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Briefcase, Zap, CheckCircle, Store, Coffee, Package } from "lucide-react";
import businessImage from "@/assets/landing-business.jpg";

export default function Business() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Visual inventory made simple.
            </h1>
            <p className="text-xl text-muted-foreground">
              Save time and stay organized with AI that tags and tracks everything in seconds.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Start Scanning
            </Button>
          </div>
          
          <div className="relative">
            <Card className="p-6 bg-gradient-card shadow-xl rounded-2xl">
              <img 
                src={businessImage} 
                alt="Business inventory organized with Cubby" 
                className="rounded-lg w-full"
              />
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-xs font-semibold text-center">
                  Paper - Shelf A
                </div>
                <div className="bg-secondary/10 text-secondary-foreground px-3 py-2 rounded-lg text-xs font-semibold text-center">
                  Ink - Drawer 3
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Cubby for Business */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
            Why Cubby for Business
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "Lightning Fast", 
                description: "Catalog inventory in seconds, not hours" 
              },
              { 
                icon: CheckCircle, 
                title: "Simple to Use", 
                description: "No complex systems or training needed" 
              },
              { 
                icon: Briefcase, 
                title: "Visual Clarity", 
                description: "See what you have and where it is" 
              }
            ].map((benefit, i) => (
              <Card key={i} className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* From Chaos to Control */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
          From Chaos to Control
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <Card className="p-8 space-y-4">
            <div className="text-destructive text-4xl font-bold mb-4">Before</div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-destructive text-xl">✗</span>
                <span className="text-muted-foreground">Hours wasted searching for supplies</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive text-xl">✗</span>
                <span className="text-muted-foreground">Over-ordering due to uncertainty</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive text-xl">✗</span>
                <span className="text-muted-foreground">Cluttered, disorganized storage</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-8 space-y-4 border-2 border-primary">
            <div className="text-primary text-4xl font-bold mb-4">After</div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>Find any item in seconds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>Know exactly what's in stock</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>Visual, organized inventory</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Perfect For */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
            Perfect for Small Retail, Service Shops, and Offices
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Store, 
                title: "Retail Shops", 
                description: "Track backstock and supplies visually" 
              },
              { 
                icon: Coffee, 
                title: "Service Businesses", 
                description: "Organize equipment and materials" 
              },
              { 
                icon: Package, 
                title: "Office Supplies", 
                description: "Never run out of essentials" 
              }
            ].map((use, i) => (
              <Card key={i} className="p-8 space-y-4 hover:scale-105 transition-transform">
                <use.icon className="h-12 w-12 text-primary" />
                <h3 className="text-2xl font-semibold">{use.title}</h3>
                <p className="text-muted-foreground">{use.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Feature */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-gradient-card text-center space-y-6">
          <div className="inline-block bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-full text-sm font-semibold">
            Coming Soon
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold">Export to CSV</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Soon you'll be able to export your entire inventory to spreadsheets for deeper analysis.
          </p>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-primary py-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-5xl font-bold text-white">
            Get Organized Instantly
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join small businesses who've simplified their inventory with Cubby.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="mt-6 h-14 px-8 text-lg"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Start Scanning Free
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
