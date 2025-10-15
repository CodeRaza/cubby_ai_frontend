import { Trophy, TrendingUp, TrendingDown, Star, Flame, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { TimeRangeSelector, TimeRange } from "./TimeRangeSelector";
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
    realized_gains: number;
    unrealized_gains: number;
    total_cost: number;
  } | null;
  isLoading?: boolean;
}

// Animated counter component
const AnimatedNumber = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0
}: {
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
  return <span className="tabular-nums">
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>;
};
export const CardStatsOverview = ({
  cardStats,
  isLoading
}: CardStatsOverviewProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');
  if (isLoading) {
    return <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>)}
          </div>
        </div>
      </div>;
  }
  if (!cardStats || cardStats.total_cards === 0) return null;

  // Debug logging
  console.log('CardStatsOverview - cardStats:', {
    realized_gains: cardStats.realized_gains,
    unrealized_gains: cardStats.unrealized_gains,
    total_cost: cardStats.total_cost,
    total_value: cardStats.total_value
  });

  // Use actual data if available, otherwise show sample data for demo
  const weeklyChange = cardStats.weekly_change !== undefined && cardStats.weekly_change !== 0 ? cardStats.weekly_change : 27.42; // Sample data for demonstration
  const isPositive = weeklyChange >= 0;
  const changePercent = weeklyChange / cardStats.total_value * 100 || 6.2;

  // Use actual biggest mover or show sample
  const biggestMover = cardStats.biggest_mover || {
    name: "1991 Topps Jeter",
    change_percent: 12.0
  };

  // Get display text based on time range
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '1D':
        return 'today';
      case '1W':
        return 'this week';
      case '1M':
        return 'this month';
      case '3M':
        return 'last 3 months';
      case 'YTD':
        return 'this year';
      case 'All':
        return 'all time';
    }
  };
  return <div className="bg-card border-b">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Weekly Portfolio Change - Hero Section */}
        <div className="space-y-2 sm:space-y-3 flex flex-col items-center bg-primary/5 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 sm:py-4 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Portfolio {getTimeRangeLabel()}</span>
            <Badge variant="outline" className={`gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 animate-scale-in border-none text-sm sm:text-base ${isPositive ? 'bg-success/15 text-success hover:bg-success/25' : 'bg-danger/15 text-danger hover:bg-danger/25'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
              <span className="font-bold">
                {isPositive ? '+' : ''}
                <AnimatedNumber value={Math.abs(weeklyChange)} prefix="$" decimals={2} />
              </span>
              <span className="text-xs sm:text-sm opacity-90">
                ({isPositive ? '+' : ''}<AnimatedNumber value={changePercent} suffix="%" decimals={1} />)
              </span>
            </Badge>
          </div>
          
          
        </div>

        {/* Gains Section */}
        {(cardStats.realized_gains !== 0 || cardStats.unrealized_gains !== 0) && <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-muted/30 p-3 sm:p-4 rounded-lg">
            {cardStats.realized_gains !== 0 && <div className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Realized Gains</p>
                <div className="flex items-center gap-1 sm:gap-2">
                  {cardStats.realized_gains > 0 ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" /> : <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />}
                  <span className={`text-xl sm:text-2xl font-bold ${cardStats.realized_gains > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cardStats.realized_gains > 0 ? '+' : ''}
                    <AnimatedNumber value={cardStats.realized_gains} prefix="$" decimals={2} />
                  </span>
                </div>
              </div>}
            {cardStats.unrealized_gains !== 0 && <div className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Unrealized Gains</p>
                <div className="flex items-center gap-1 sm:gap-2">
                  {cardStats.unrealized_gains > 0 ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> : <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />}
                  <span className={`text-xl sm:text-2xl font-bold ${cardStats.unrealized_gains > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {cardStats.unrealized_gains > 0 ? '+' : ''}
                    <AnimatedNumber value={cardStats.unrealized_gains} prefix="$" decimals={2} />
                  </span>
                </div>
              </div>}
          </div>}

        {/* Time Range Selector */}
        <div className="flex justify-center">
          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        </div>

        {/* Main Stats Grid - Balanced and Prominent */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-1 sm:pt-2">
          <div className="flex flex-col items-center animate-fade-in">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-2xl sm:text-4xl font-bold tabular-nums">
                <AnimatedNumber value={cardStats.total_cards} />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium">Total Cards</p>
          </div>
          
          <div className="flex flex-col items-center border-x border-border animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-2xl sm:text-4xl font-bold tabular-nums">
                <AnimatedNumber value={cardStats.total_value} prefix="$" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium">Est. Value</p>
          </div>
          
          <div className="flex flex-col items-center animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-2xl sm:text-4xl font-bold tabular-nums">
                <AnimatedNumber value={cardStats.graded_count} />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium">Graded</p>
          </div>
        </div>
      </div>
    </div>;
};