import { Trophy, TrendingUp, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CardStatsOverviewProps {
  cardStats: {
    total_cards: number;
    total_value: number;
    graded_count: number;
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

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{cardStats.total_cards}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </div>
          <div className="text-center border-x border-border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">${cardStats.total_value.toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Est. Value</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{cardStats.graded_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">Graded</p>
          </div>
        </div>
      </div>
    </div>
  );
};
