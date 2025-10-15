import { Button } from "@/components/ui/button";
import { Crown, Shield, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  source: string;
  isAdmin: boolean;
  planName: string;
}

export const DashboardHeader = ({ source, isAdmin, planName }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold">{source === 'sports-cards' ? 'Card Collection' : 'Cubby'}</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
            >
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Admin</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/subscription')}
            className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
          >
            <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">{planName}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
