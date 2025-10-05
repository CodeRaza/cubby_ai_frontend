import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const LandingNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img 
            src="/cubby-favicon.png" 
            alt="Cubby Logo" 
            className="h-8 w-8"
          />
          <span className="text-2xl font-bold text-primary">Cubby</span>
        </div>
        
        <Button 
          size="lg" 
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={() => navigate('/auth?mode=signup')}
        >
          Start Scanning Free
        </Button>
      </div>
    </nav>
  );
};
