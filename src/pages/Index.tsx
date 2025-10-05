import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Search, Box, Home, Truck, Store, Shield, ArrowRight, Check } from "lucide-react";
import cubbyLogo from "@/assets/cubby-logo.png";
import garageScan from "@/assets/garage-scan.jpg";
import { LandingFooter } from "@/components/LandingFooter";
const Index = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showSearchScreen, setShowSearchScreen] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    // Transition to search screen after 4 seconds
    const timer = setTimeout(() => {
      setShowSearchScreen(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={cubbyLogo} alt="Cubby" className="h-10 w-10" />
              <span className="text-2xl font-bold text-foreground">Cubby</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="text-xs sm:text-sm"
              >
                Sign In
              </Button>
              <Button size="sm" className="sm:size-lg rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-xs sm:text-base px-3 sm:px-6" onClick={() => navigate('/auth?mode=signup')}>
                <span className="hidden sm:inline">Start Scanning Free</span>
                <span className="sm:hidden">Start Free</span>
                <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32 overflow-hidden">
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
              <Button size="lg" className="text-lg px-8 py-6 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all" onClick={() => navigate('/auth?mode=signup')}>
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full font-semibold" onClick={() => scrollToSection('how-it-works')}>
                See how it works
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Your photos stay private and secure</span>
            </div>
          </div>

          <div className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{
          animationDelay: '0.2s'
        }}>
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-1/4 right-0 w-72 h-72 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/30 to-transparent rounded-full blur-3xl animate-float" style={{
              animationDelay: '1.5s'
            }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl animate-float" style={{
              animationDelay: '0.7s'
            }} />
            </div>

            {/* Phone Mockup */}
            <div className="relative mx-auto max-w-sm">
              {/* Phone Frame */}
              <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="bg-background rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-card px-6 py-2 flex items-center justify-between text-xs">
                    <span className="font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 border border-foreground/30 rounded-sm relative">
                        <div className="absolute inset-0.5 bg-foreground/80 rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="bg-gradient-to-b from-muted/30 to-background p-6 space-y-4 min-h-[600px] relative">
                    {/* Scan Screen */}
                    <div className={`absolute inset-0 p-6 transition-all duration-700 ${showSearchScreen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img src={cubbyLogo} alt="Cubby" className="h-10 w-10 animate-float" />
                          <div>
                            <h3 className="font-bold text-lg">Cubby</h3>
                            <p className="text-xs text-muted-foreground">Scanning garage...</p>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg animate-pulse">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                      </div>

                    {/* Camera View Simulation */}
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 aspect-[4/3] shadow-lg border-2 border-primary/20">
                      <img src={garageScan} alt="Garage scan" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium">Live Scan</span>
                      </div>
                      
                      {/* Scan Grid Overlay */}
                      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                      </svg>

                      {/* Detection Boxes */}
                      <div className="absolute top-1/4 left-1/6 w-1/3 h-1/4 border-2 border-primary rounded-lg animate-pulse mx-[40px] my-[30px]">
                        <div className="absolute -top-8 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>DeWalt 20V Cordless Drill</span>
                            <span className="opacity-80">98%</span>
                          </div>
                          <div className="text-[10px] opacity-70">Power Tools</div>
                        </div>
                      </div>
                      <div className="absolute top-1/2 right-1/4 w-1/4 h-1/5 border-2 border-secondary rounded-lg animate-pulse" style={{
                      animationDelay: '0.2s'
                    }}>
                        <div className="absolute -top-8 left-0 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Purdy Pro-Extra Brushes</span>
                            <span className="opacity-80">95%</span>
                          </div>
                          <div className="text-[10px] opacity-70">Paint Supplies</div>
                        </div>
                      </div>
                      <div className="absolute bottom-1/4 left-1/4 w-1/5 h-1/6 border-2 border-accent rounded-lg animate-pulse" style={{
                      animationDelay: '0.4s'
                    }}>
                        <div className="absolute -top-8 left-0 bg-accent text-accent-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Estwing 16oz Claw Hammer</span>
                            <span className="opacity-80">97%</span>
                          </div>
                          <div className="text-[10px] opacity-70">Hand Tools</div>
                        </div>
                      </div>
                      <div className="absolute top-1/3 right-1/3 w-1/6 h-1/6 border-2 border-primary/70 rounded-lg animate-pulse" style={{
                      animationDelay: '0.6s'
                    }}>
                        <div className="absolute -top-8 left-0 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Craftsman Metric Wrench Set</span>
                            <span className="opacity-80">93%</span>
                          </div>
                          <div className="text-[10px] opacity-70">Hardware</div>
                        </div>
                      </div>
                      <div className="absolute bottom-1/3 right-1/5 w-1/5 h-1/5 border-2 border-secondary/70 rounded-lg animate-pulse" style={{
                      animationDelay: '0.8s'
                    }}>
                        <div className="absolute -top-8 left-0 bg-secondary/90 text-secondary-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Behr Premium Plus Paint</span>
                            <span className="opacity-80">91%</span>
                          </div>
                          <div className="text-[10px] opacity-70">Paint Supplies</div>
                        </div>
                      </div>
                      
                    </div>

                    {/* Detection Results */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-semibold">Items Detected</span>
                        <Badge className="bg-primary text-primary-foreground">7 items</Badge>
                      </div>
                      
                      {[{
                      name: 'DeWalt 20V Cordless Drill',
                      category: 'Power Tools',
                      confidence: '98%',
                      location: 'Garage - Shelf 2',
                      color: 'bg-primary'
                    }, {
                      name: 'Purdy Pro-Extra Brushes',
                      category: 'Paint Supplies',
                      confidence: '95%',
                      location: 'Garage - Shelf 2',
                      color: 'bg-secondary'
                    }, {
                      name: 'Estwing 16oz Claw Hammer',
                      category: 'Hand Tools',
                      confidence: '97%',
                      location: 'Garage - Shelf 2',
                      color: 'bg-accent'
                    }, {
                      name: 'Craftsman Metric Wrench Set',
                      category: 'Hardware',
                      confidence: '93%',
                      location: 'Garage - Shelf 2',
                      color: 'bg-primary/70'
                    }, {
                      name: 'Behr Premium Plus Paint',
                      category: 'Paint Supplies',
                      confidence: '91%',
                      location: 'Garage - Shelf 2',
                      color: 'bg-secondary/70'
                    }].map((item, i) => <div key={item.name} className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-sm border border-border/50 animate-fade-in-up hover:shadow-md transition-all" style={{
                      animationDelay: `${0.6 + i * 0.1}s`
                    }}>
                          <div className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center shadow-sm`}>
                            <Box className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.confidence}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground/80">{item.category}</p>
                            <p className="text-xs text-muted-foreground">{item.location}</p>
                          </div>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        </div>)}
                    </div>
                    </div>

                    {/* Search Screen */}
                    <div className={`absolute inset-0 p-6 transition-all duration-700 ${showSearchScreen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img src={cubbyLogo} alt="Cubby" className="h-10 w-10 animate-float" />
                          <div>
                            <h3 className="font-bold text-lg">Cubby</h3>
                            <p className="text-xs text-muted-foreground">Search your items</p>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                          <Search className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input 
                          type="text" 
                          value="dewalt drill"
                          readOnly
                          className="w-full pl-12 pr-4 py-3 bg-card border-2 border-primary/50 rounded-xl text-sm font-medium focus:outline-none shadow-lg"
                        />
                      </div>

                      {/* Search Results Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold">Found in your inventory</span>
                        <Badge className="bg-green-500 text-white">1 match</Badge>
                      </div>

                      {/* Main Result Card */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border-2 border-primary shadow-xl mb-4">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                            <Box className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base mb-1">DeWalt 20V Cordless Drill</h4>
                            <p className="text-xs text-muted-foreground mb-2">Power Tools • 98% match</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Garage</Badge>
                              <Badge variant="outline" className="text-xs">Shelf 2</Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Photo Preview */}
                        <div className="relative rounded-xl overflow-hidden aspect-video mb-3">
                          <img src={garageScan} alt="Location" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <span className="text-xs text-white font-medium">Scanned 2 days ago</span>
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>

                        <Button className="w-full" size="sm">
                          View Location Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                      {/* Related Items */}
                      <div className="space-y-2">
                        <span className="text-sm font-semibold block mb-2">Nearby items</span>
                        {[{
                        name: 'Drill Bits Set',
                        location: 'Garage - Shelf 2',
                        color: 'bg-secondary'
                      }, {
                        name: 'Battery Charger',
                        location: 'Garage - Shelf 2',
                        color: 'bg-accent'
                      }].map((item, i) => <div key={item.name} className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-sm border border-border/50 hover:shadow-md transition-all">
                            <div className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center shadow-sm`}>
                              <Box className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.location}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-foreground rounded-b-3xl" />
              </div>

              {/* Floating Elements */}
              <div className={`absolute -bottom-6 -right-6 bg-card border border-border text-foreground px-4 py-2 rounded-full shadow-xl text-sm font-semibold animate-float transition-all duration-700 ${showSearchScreen ? 'opacity-0' : 'opacity-100'}`} style={{
              animationDelay: '0.5s'
            }}>
                <Check className="h-4 w-4 inline mr-1 text-green-500" />
                Instant Results
              </div>
              <div className={`absolute -top-6 -left-6 bg-card border border-border text-foreground px-4 py-2 rounded-full shadow-xl text-sm font-semibold animate-float transition-all duration-700 ${showSearchScreen ? 'opacity-100' : 'opacity-0'}`} style={{
              animationDelay: '0.5s'
            }}>
                <Search className="h-4 w-4 inline mr-1 text-primary" />
                Smart Search
              </div>
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
            {[{
            icon: Camera,
            step: "1",
            title: "Scan or Upload Photos",
            description: "Take a picture of any shelf, box, or bin. Works with your phone or tablet."
          }, {
            icon: Sparkles,
            step: "2",
            title: "Cubby Organizes It",
            description: "AI recognizes and tags each item with its location automatically."
          }, {
            icon: Search,
            step: "3",
            title: "Find It Instantly",
            description: "Search 'drill,' 'toilet paper,' or 'holiday lights' — Cubby tells you where it is."
          }].map((item, index) => <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
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
              </Card>)}
          </div>

          <div className="text-center">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full font-semibold shadow-xl" onClick={() => navigate('/auth?mode=signup')}>
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
            {[{
            icon: Search,
            title: "Never lose things again",
            description: "Find anything in seconds with smart search",
            color: "text-primary"
          }, {
            icon: Sparkles,
            title: "Smart visual memory",
            description: "Cubby remembers what's in every photo",
            color: "text-secondary"
          }, {
            icon: Camera,
            title: "No manual sorting",
            description: "Just snap and done — AI handles the rest",
            color: "text-accent"
          }].map((item, index) => <Card key={index} className="hover:shadow-xl transition-all duration-300 group">
                <CardContent className="pt-8 pb-6">
                  <div className={`h-14 w-14 mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-full w-full" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full font-semibold" onClick={() => navigate('/auth?mode=signup')}>
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
            {[{
            icon: Home,
            title: "Pantry",
            description: "Know what's running low at a glance",
            gradient: "from-primary/10 to-primary/5"
          }, {
            icon: Box,
            title: "Garage",
            description: "Find tools without digging through bins",
            gradient: "from-secondary/10 to-secondary/5"
          }, {
            icon: Truck,
            title: "Moving",
            description: "Label boxes visually, not with tape",
            gradient: "from-accent/10 to-accent/5"
          }, {
            icon: Store,
            title: "Small Business",
            description: "Track stockrooms and backrooms easily",
            gradient: "from-primary/10 to-accent/5"
          }].map((useCase, index) => <Card key={index} className={`bg-gradient-to-br ${useCase.gradient} border-0 hover:shadow-xl transition-all duration-300 group cursor-pointer`} onClick={() => navigate('/auth?mode=signup')}>
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="h-12 w-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                    <useCase.icon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>)}
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

                <Button size="lg" variant="secondary" className="text-lg px-10 py-7 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all text-primary" onClick={() => navigate('/auth?mode=signup')}>
                  <Camera className="mr-2 h-6 w-6" />
                  Start Scanning Free
                </Button>

                <p className="text-sm text-white/80">
                  Works on iPhone, Android, and web • No credit card required
                </p>

                <div className="flex flex-wrap justify-center gap-6 pt-4">
                  {['Free forever plan', '10 scans/month', 'AI-powered tagging', 'Multi-device sync'].map(feature => <div key={feature} className="flex items-center gap-2 text-white/90">
                      <Check className="h-5 w-5" />
                      <span>{feature}</span>
                    </div>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>;
};
export default Index;