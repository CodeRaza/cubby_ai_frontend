import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Building, Users, ClipboardCheck, Home, Hotel, Sparkles } from "lucide-react";

export default function Property() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Stay stocked across every property.
            </h1>
            <p className="text-xl text-muted-foreground">
              Cubby helps you track cleaning supplies and inventory automatically, room by room.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
              onClick={() => navigate('/auth')}
            >
              Start Scanning Your Properties
            </Button>
          </div>
          
          <div className="relative">
            <Card className="p-6 bg-gradient-card shadow-xl rounded-2xl">
              <img 
                src="/garage-scan.jpg" 
                alt="Property supplies organized with Cubby" 
                className="rounded-lg w-full"
              />
              <div className="space-y-2 mt-4">
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Towels - Linen Closet
                </div>
                <div className="bg-accent/10 text-accent-foreground px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Soap - Supply Room
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Perfect For Airbnb */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8">
            Perfect for Airbnb Hosts and Small Hotels
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
            Never run out of supplies between guest stays. Track inventory across multiple properties with ease.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { 
                icon: Home, 
                title: "Airbnb Hosts", 
                description: "Track supplies for every rental" 
              },
              { 
                icon: Hotel, 
                title: "Small Hotels", 
                description: "Manage inventory room by room" 
              },
              { 
                icon: Building, 
                title: "Property Managers", 
                description: "Oversee multiple locations" 
              }
            ].map((type, i) => (
              <Card key={i} className="p-8 space-y-4 hover:scale-105 transition-transform">
                <type.icon className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-2xl font-semibold">{type.title}</h3>
                <p className="text-muted-foreground">{type.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Room-by-Room Organization */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
          Room-by-Room Organization
        </h2>
        <p className="text-xl text-muted-foreground text-center mb-16">
          Tag supplies by location for instant access
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { room: "Linen Closet", items: "Towels, Sheets, Blankets" },
            { room: "Supply Room", items: "Cleaning Products, Soap" },
            { room: "Kitchen", items: "Coffee, Snacks, Utensils" },
            { room: "Bathroom", items: "Toiletries, Toilet Paper" }
          ].map((loc, i) => (
            <Card key={i} className="p-6 space-y-3 hover:shadow-lg transition-shadow">
              <div className="h-32 bg-gradient-primary/10 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-12 w-12 text-primary" />
              </div>
              <h4 className="font-semibold text-lg">{loc.room}</h4>
              <p className="text-sm text-muted-foreground">{loc.items}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Built for Teams */}
      <section className="bg-gradient-primary py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-white">
              <Users className="h-16 w-16" />
              <h2 className="text-3xl lg:text-4xl font-bold">
                Built for Teams
              </h2>
              <p className="text-xl text-white/90">
                Share inventory across cleaning staff and property managers. Everyone stays in sync.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span>Real-time updates across all team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span>Track supplies across multiple properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span>Never miss a restock with visual inventory</span>
                </li>
              </ul>
            </div>
            
            <Card className="p-8 bg-white">
              <h3 className="text-2xl font-bold mb-4">Stay Stocked, Not Stressed</h3>
              <p className="text-muted-foreground mb-6">
                From fresh towels to cleaning supplies, know what you have at every property — instantly.
              </p>
              <Button 
                size="lg" 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => navigate('/auth')}
              >
                Start Scanning Free
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
          How Property Managers Use Cubby
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: "Pre-Guest Prep",
              description: "Quickly verify you have all necessary supplies before guest check-in"
            },
            {
              title: "Between Stays",
              description: "Track what needs restocking after each guest departure"
            },
            {
              title: "Bulk Ordering",
              description: "See exactly what supplies are low across all properties"
            },
            {
              title: "Seasonal Storage",
              description: "Track seasonal items and know where everything is stored"
            }
          ].map((use, i) => (
            <Card key={i} className="p-8 space-y-3 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold">{use.title}</h3>
              <p className="text-muted-foreground">{use.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6">
          Ready to Simplify Property Management?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join hosts and property managers who've streamlined their inventory.
        </p>
        <Button 
          size="lg" 
          className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
          onClick={() => navigate('/auth')}
        >
          Start Scanning Free
        </Button>
      </section>

      <LandingFooter />
    </div>
  );
}
