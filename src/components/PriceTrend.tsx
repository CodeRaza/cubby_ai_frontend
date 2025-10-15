import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceTrendProps {
  value: number | null;
  showIcon?: boolean;
  className?: string;
}

export const PriceTrend = ({ value, showIcon = true, className }: PriceTrendProps) => {
  if (value === null || value === undefined) {
    return null;
  }

  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 0.1;
  const formattedValue = `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm font-medium transition-colors",
        isNeutral ? "text-muted-foreground" : isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
        className
      )}
    >
      {showIcon && (
        <>
          {isNeutral ? (
            <Minus className="h-3 w-3" />
          ) : isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
        </>
      )}
      <span>{formattedValue}</span>
    </div>
  );
};