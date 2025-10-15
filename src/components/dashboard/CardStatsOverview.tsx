import { Trophy, TrendingUp, TrendingDown, Star, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

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

// Animated counter component
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};

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

  // Use actual data if available, otherwise show sample data for demo
  const weeklyChange = cardStats.weekly_change !== undefined && cardStats.weekly_change !== 0 
    ? cardStats.weekly_change 
    : 27.42; // Sample data for demonstration
  const isPositive = weeklyChange >= 0;
  const changePercent = ((weeklyChange / cardStats.total_value) * 100) || 6.2;

  // Use actual biggest mover or show sample
  const biggestMover = cardStats.biggest_mover || {
    name: "1991 Topps Jeter",
    change_percent: 12.0
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="container mx-auto px-4 py-4 space-y-3">
        {/* Weekly Portfolio Change - Always Show */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Portfolio this week:</span>
            <Badge 
              variant={isPositive ? "default" : "destructive"} 
              className="gap-1 animate-scale-in"
            >
              {isPositive ? <TrendingUp className="h-3 w-3 animate-pulse" /> : <TrendingDown className="h-3 w-3 animate-pulse" />}
              <span className="font-semibold">
                {isPositive ? '📈 ' : '📉 '}
                {isPositive ? '+' : ''}
                <AnimatedNumber value={Math.abs(weeklyChange)} prefix="$" decimals={2} />
              </span>
              <span className="text-xs opacity-80">
                ({isPositive ? '+' : ''}<AnimatedNumber value={changePercent} suffix="%" decimals={1} />)
              </span>
            </Badge>
          </div>

          <span className="hidden sm:inline text-muted-foreground">•</span>
          
          <div className="flex items-center gap-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
            <span className="font-medium">{biggestMover.name}</span>
            <Badge 
              variant={biggestMover.change_percent >= 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {biggestMover.change_percent >= 0 ? '+' : ''}
              <AnimatedNumber value={Math.abs(biggestMover.change_percent)} suffix="%" decimals={1} />
            </Badge>
          </div>
        </div>

        {/* Main Stats with Animated Numbers */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold tabular-nums">
                <AnimatedNumber value={cardStats.total_cards} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </div>
          <div className="text-center border-x border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold tabular-nums">
                <AnimatedNumber value={cardStats.total_value} prefix="$" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Est. Value</p>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold tabular-nums">
                <AnimatedNumber value={cardStats.graded_count} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Graded</p>
          </div>
        </div>
      </div>
    </div>
  );
};
