import { Trophy, TrendingUp, TrendingDown, Star, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CardStatsOverviewProps {
  cardStats: {
    total_cards: number;
    total_value: number;
    graded_count: number;
    weekly_change?: number;
    biggest_mover?: {
      name: string;
      change_percent: number;
    };
  } | null;
  isLoading?: boolean;
}

export const CardStatsOverview = ({ cardStats, isLoading }: CardStatsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cardStats || cardStats.total_cards === 0) return null;

  const weeklyChange = cardStats.weekly_change || 0;
  const isPositive = weeklyChange >= 0;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="container mx-auto px-4 py-4 space-y-3">
        {/* Weekly Portfolio Change */}
        {weeklyChange !== 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Portfolio this week:</span>
            <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}{weeklyChange > 0 ? `$${weeklyChange.toFixed(2)}` : weeklyChange.toFixed(2)}
              <span className="text-xs opacity-80">({isPositive ? '+' : ''}{((weeklyChange / cardStats.total_value) * 100).toFixed(1)}%)</span>
            </Badge>
            {cardStats.biggest_mover && (
              <>
                <span className="text-muted-foreground mx-2">•</span>
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="font-medium truncate max-w-[150px]">{cardStats.biggest_mover.name}</span>
                  <span className={cardStats.biggest_mover.change_percent >= 0 ? "text-green-600" : "text-red-600"}>
                    {cardStats.biggest_mover.change_percent >= 0 ? '+' : ''}{cardStats.biggest_mover.change_percent.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold animate-fade-in">{cardStats.total_cards}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </div>
          <div className="text-center border-x border-border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold animate-fade-in">${cardStats.total_value.toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Est. Value</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold animate-fade-in">{cardStats.graded_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">Graded</p>
          </div>
        </div>
      </div>
    </div>
  );
};
