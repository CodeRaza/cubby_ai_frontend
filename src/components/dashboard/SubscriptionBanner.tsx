import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface SubscriptionBannerProps {
  subscription: {
    plan_tier: string;
    scans_used: number;
    scans_limit: number;
    bonus_credits: number;
  };
}

export const SubscriptionBanner = ({ subscription }: SubscriptionBannerProps) => {
  const totalScans = subscription.scans_limit + subscription.bonus_credits;
  const scansUsed = subscription.scans_used;
  const scansRemaining = Math.max(0, totalScans - scansUsed);
  const usagePercent = totalScans > 0 ? (scansUsed / totalScans) * 100 : 0;

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
        {scansRemaining <= 10 && scansRemaining > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Running low on items! Consider upgrading or buying an item pack.
          </p>
        )}
        {scansRemaining === 0 && (
          <p className="text-xs text-destructive mt-2">
            Out of items! Upgrade your plan or purchase an item pack to continue.
          </p>
        )}
      </div>
    </div>
  );
};
