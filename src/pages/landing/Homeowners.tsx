import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Camera, Search, Sparkles, Home, Package, Utensils } from "lucide-react";
import homeownersImage from "@/assets/landing-homeowners.jpg";

export default function Homeowners() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Find anything in seconds — just snap a photo.
            </h1>
            <p className="text-xl text-muted-foreground">
              Cubby automatically tags and remembers where everything is, so you can stop searching and start living.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
              onClick={() => navigate('/auth')}
            >
              Start Scanning Free
            </Button>
          </div>
          
          <div className="relative">
            <Card className="p-6 bg-gradient-card shadow-xl rounded-2xl">
              <img 
                src={homeownersImage} 
                alt="Kitchen organized with Cubby" 
                className="rounded-lg w-full"
              />
              <div className="absolute top-8 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-float">
                "Snacks" Found!
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, title: "1. Take Photo", description: "Snap a photo of your shelf, drawer, or closet" },
              { icon: Sparkles, title: "2. Cubby Organizes", description: "AI automatically tags and categorizes everything" },
              { icon: Search, title: "3. Find Instantly", description: "Search and locate any item in seconds" }
            ].map((step, i) => (
              <Card key={i} className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect for Busy Homes */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">Perfect for Busy Homes</h2>
        <p className="text-xl text-muted-foreground text-center mb-16">Organize every corner of your home</p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Utensils, title: "Pantry", description: "Never buy duplicates again" },
            { icon: Home, title: "Closet", description: "Find outfits and accessories instantly" },
            { icon: Package, title: "Junk Drawer", description: "Know exactly what's where" }
          ].map((use, i) => (
            <Card key={i} className="p-8 space-y-4 hover:scale-105 transition-transform">
              <use.icon className="h-12 w-12 text-primary" />
              <h3 className="text-2xl font-semibold">{use.title}</h3>
              <p className="text-muted-foreground">{use.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Emotional Payoff */}
      <section className="bg-gradient-primary py-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-5xl font-bold text-white">
            Cubby remembers so you don't have to
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Spend less time searching, more time living. Your home, your way.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="mt-6 h-14 px-8 text-lg"
            onClick={() => navigate('/auth')}
          >
            Start Scanning Free
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
