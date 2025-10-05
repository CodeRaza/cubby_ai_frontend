import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Box, Camera, CheckCircle, Home, GraduationCap, Warehouse } from "lucide-react";

export default function Movers() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Know what's in every box — before you unpack.
            </h1>
            <p className="text-xl text-muted-foreground">
              Cubby keeps track of every item you pack with one photo. No labels. No chaos.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
              onClick={() => navigate('/auth')}
            >
              Start Scanning Boxes
            </Button>
          </div>
          
          <div className="relative">
            <Card className="p-6 bg-gradient-card shadow-xl rounded-2xl">
              <img 
                src="/garage-scan.jpg" 
                alt="Moving boxes organized with Cubby" 
                className="rounded-lg w-full"
              />
              <div className="space-y-2 mt-4">
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Kitchen - Box 1
                </div>
                <div className="bg-secondary/10 text-secondary-foreground px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Books - Box 2
                </div>
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
              { 
                icon: Camera, 
                title: "Scan Before Packing", 
                description: "Take a photo of what's going in each box" 
              },
              { 
                icon: Box, 
                title: "Tag Boxes", 
                description: "Cubby automatically labels and tracks everything" 
              },
              { 
                icon: CheckCircle, 
                title: "Search Later", 
                description: "Find any item instantly when you need it" 
              }
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

      {/* Perfect For */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
          Perfect for Moving, Dorms, or Storage
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: Home, 
              title: "Moving Homes", 
              description: "Track every box during your move" 
            },
            { 
              icon: GraduationCap, 
              title: "College Dorms", 
              description: "Organize dorm room essentials" 
            },
            { 
              icon: Warehouse, 
              title: "Storage Units", 
              description: "Remember what's in storage" 
            }
          ].map((use, i) => (
            <Card key={i} className="p-8 space-y-4 hover:scale-105 transition-transform">
              <use.icon className="h-12 w-12 text-primary" />
              <h3 className="text-2xl font-semibold">{use.title}</h3>
              <p className="text-muted-foreground">{use.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Peace of Mind */}
      <section className="bg-gradient-primary py-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-5xl font-bold text-white">
            No more guessing what's where.
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Moving is stressful enough. Let Cubby handle the organization.
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

      {/* Bonus Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-gradient-card text-center space-y-6">
          <h3 className="text-2xl lg:text-3xl font-bold">Moving Soon?</h3>
          <p className="text-muted-foreground">
            Download our free moving checklist to stay organized
          </p>
          <Button 
            variant="outline" 
            size="lg"
            className="h-12"
          >
            Download Free Checklist
          </Button>
        </Card>
      </section>

      <LandingFooter />
    </div>
  );
}
