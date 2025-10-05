import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingFooter = () => {
  return (
    <footer className="bg-muted py-12 mt-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <p className="text-sm">Your photos stay private and secure.</p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Cubby. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
