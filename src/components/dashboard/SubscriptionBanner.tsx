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
        
        {/* Compact upgrade prompt */}
        {isFree && scansRemaining <= 10 && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {scansRemaining === 0 ? '⚠️ Almost out!' : '⚠️ Running low'}
            </p>
            <Button 
              size="sm"
              variant="default"
              onClick={() => navigate('/subscription')}
              className="h-7 text-xs bg-gradient-premium hover:opacity-90 transition-opacity shadow-md"
            >
              Upgrade 🚀
            </Button>
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
