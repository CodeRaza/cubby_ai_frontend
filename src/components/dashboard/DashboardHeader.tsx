import { Button } from "@/components/ui/button";
import { Crown, Shield, Settings as SettingsIcon, LogOut, TrendingUp, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  source: string;
  isAdmin: boolean;
  planName: string;
}

export const DashboardHeader = ({ source, isAdmin, planName }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    if (source === 'sports-cards') {
      loadWatchlistCount();
    }
  }, [source]);

  const loadWatchlistCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setWatchlistCount(count || 0);
  };

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
          {source === 'sports-cards' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/market')}
                className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3 bg-[#00C46C]/10 hover:bg-[#00C46C]/20 border-[#00C46C]/30"
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00C46C]" />
                <span className="hidden sm:inline text-xs sm:text-sm text-[#00C46C]">Market</span>
              </Button>
              {watchlistCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/market?view=watchlist')}
                  className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3 relative"
                >
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Watchlist</span>
                  <span className="absolute -top-1 -right-1 bg-[#00C46C] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {watchlistCount}
                  </span>
                </Button>
              )}
            </>
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
