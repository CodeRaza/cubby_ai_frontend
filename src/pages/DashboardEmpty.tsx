import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Camera } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { CardStatsOverview } from "@/components/dashboard/CardStatsOverview";

const DashboardEmpty = () => {
  const navigate = useNavigate();
  const source = 'sports-cards'; // Can be changed to test different sources

  // Mock empty subscription data
  const mockSubscription = {
    plan_tier: 'free',
    scans_used: 0,
    scans_limit: 50,
    bonus_credits: 0
  };

  // Mock empty card stats
  const mockCardStats = {
    total_cards: 0,
    total_value: 0,
    graded_count: 0,
    realized_gains: 0,
    unrealized_gains: 0,
    total_cost: 0
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <DashboardHeader 
        source={source} 
        isAdmin={false} 
        planName="Free" 
      />

      <SubscriptionBanner subscription={mockSubscription} />

      {source === 'sports-cards' && (
        <CardStatsOverview cardStats={mockCardStats} isLoading={false} />
      )}

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {source === 'sports-cards' ? 'Collections' : 'Locations'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {source === 'sports-cards' ? 'Organize your cards by collection' : 'Organize items by location'}
            </p>
          </div>
          <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" disabled>
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">{source === 'sports-cards' ? 'Add Collection' : 'Add Location'}</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted/50 flex items-center justify-center">
            <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50" />
          </div>
          
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl sm:text-2xl font-bold">
              {source === 'sports-cards' ? 'Start Your Collection' : 'No Locations Yet'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {source === 'sports-cards' 
                ? 'Create your first collection and start tracking your sports cards. Scan cards, monitor values, and build your portfolio!'
                : 'Create your first location to start organizing your items. You can scan multiple items at once and track everything in one place.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              View Active Dashboard
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="gap-2"
              disabled
            >
              <Camera className="h-5 w-5" />
              Start Scanning
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl">
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="text-3xl">📸</div>
              <h4 className="font-semibold text-sm">AI-Powered Scanning</h4>
              <p className="text-xs text-muted-foreground">
                {source === 'sports-cards' 
                  ? 'Scan multiple cards at once with advanced AI recognition'
                  : 'Scan multiple items at once with AI detection'}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="text-3xl">📊</div>
              <h4 className="font-semibold text-sm">
                {source === 'sports-cards' ? 'Track Values' : 'Stay Organized'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {source === 'sports-cards' 
                  ? 'Monitor card values and portfolio performance in real-time'
                  : 'Know exactly where everything is and when to use it'}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="text-3xl">🔍</div>
              <h4 className="font-semibold text-sm">Instant Search</h4>
              <p className="text-xs text-muted-foreground">
                {source === 'sports-cards' 
                  ? 'Find any card by player, year, brand, or set name'
                  : 'Find any item instantly across all your locations'}
              </p>
            </div>
          </div>
        </div>

        {/* Demo prompt */}
        <div className="fixed bottom-4 right-4 max-w-sm">
          <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 shadow-lg">
            <p className="text-sm font-medium mb-2">📍 Viewing Empty State Demo</p>
            <p className="text-xs text-muted-foreground mb-3">
              This is how the dashboard looks before any data is added.
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Back to Active Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardEmpty;
