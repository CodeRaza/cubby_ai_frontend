import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Bell, TrendingUp, Infinity } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionBannerProps {
  subscription: {
    plan_tier: string;
    scans_used: number;
    scans_limit: number;
    bonus_credits: number;
  };
}

export const SubscriptionBanner = ({ subscription }: SubscriptionBannerProps) => {
  const navigate = useNavigate();
  const totalScans = subscription.scans_limit + subscription.bonus_credits;
  const scansUsed = subscription.scans_used;
  const scansRemaining = Math.max(0, totalScans - scansUsed);
  const usagePercent = totalScans > 0 ? (scansUsed / totalScans) * 100 : 0;
  const isFree = subscription.plan_tier === 'free';
  const progressToNext = isFree ? (scansUsed / 50) * 100 : 0;

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Items this month</span>
            {subscription.bonus_credits > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                +{subscription.bonus_credits} bonus
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {scansRemaining} of {totalScans} remaining
          </span>
        </div>
        <Progress value={usagePercent} className="h-2" />
        
        {/* Enhanced upgrade prompt for free tier */}
        {isFree && scansRemaining <= 10 && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {scansRemaining === 0 ? '🚫 Out of scans!' : '⚠️ Almost out!'}
                  </p>
                  {isFree && scansUsed > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {progressToNext.toFixed(0)}% to Starter
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Upgrade to unlock:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Bell className="h-3 w-3" />
                    Price alerts
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Real-time pricing
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Infinity className="h-3 w-3" />
                    More scans
                  </Badge>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/subscription')}
                className="flex-shrink-0"
              >
                Upgrade 🚀
              </Button>
            </div>
          </div>
        )}

        {/* Standard messages for other cases */}
        {!isFree && scansRemaining <= 10 && scansRemaining > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Running low on items! Consider buying an item pack.
          </p>
        )}
        {!isFree && scansRemaining === 0 && (
          <p className="text-xs text-destructive mt-2">
            Out of items! Purchase an item pack to continue.
          </p>
        )}
      </div>
    </div>
  );
};
