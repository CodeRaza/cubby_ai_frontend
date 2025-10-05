import { LandingNav } from "@/components/LandingNav";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Wrench, Camera, Tag, Search } from "lucide-react";

export default function Garage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Never lose your tools again.
            </h1>
            <p className="text-xl text-muted-foreground">
              Cubby helps you instantly find what you need — from your drill to your duct tape.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
              onClick={() => navigate('/auth')}
            >
              Start Scanning
            </Button>
          </div>
          
          <div className="relative">
            <Card className="p-6 bg-gradient-card shadow-xl rounded-2xl">
              <img 
                src="/garage-scan.jpg" 
                alt="Organized garage with Cubby" 
                className="rounded-lg w-full"
              />
              <div className="absolute top-8 right-8 bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-float">
                Drill Found! Shelf 3
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Built for DIYers */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">Built for DIYers</h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="p-8 space-y-4">
              <h3 className="text-2xl font-bold text-destructive">Before</h3>
              <p className="text-muted-foreground">
                "Where did I put the paint? Was it behind the saws or near the workbench?"
              </p>
              <div className="h-48 bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Cluttered, Chaotic Shelves</span>
              </div>
            </Card>
            
            <Card className="p-8 space-y-4 border-2 border-primary">
              <h3 className="text-2xl font-bold text-primary">After</h3>
              <p className="text-muted-foreground">
                "Let me check Cubby... Paint is on Shelf 2, third bin from the left."
              </p>
              <div className="h-48 bg-gradient-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-semibold">Organized & Tagged</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Snap. Tag. Find. */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">Snap. Tag. Find.</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Camera, title: "Snap", description: "Take a photo of your garage shelves" },
            { icon: Tag, title: "Tag", description: "AI identifies and labels every tool" },
            { icon: Search, title: "Find", description: "Search and locate anything instantly" }
          ].map((step, i) => (
            <Card key={i} className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-warm rounded-full flex items-center justify-center mx-auto">
                <step.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* For People Who Build Things */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center space-y-8">
          <Wrench className="h-20 w-20 text-primary mx-auto" />
          <h2 className="text-3xl lg:text-5xl font-bold">
            For People Who Build Things
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're a weekend warrior or a daily DIYer, Cubby keeps your workspace under control.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6">
          Get Your Garage Organized Today
        </h2>
        <Button 
          size="lg" 
          className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
          onClick={() => navigate('/auth')}
        >
          Start Scanning Your Garage
        </Button>
      </section>

      <LandingFooter />
    </div>
  );
}
