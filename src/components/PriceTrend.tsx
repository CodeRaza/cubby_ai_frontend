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
        isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-danger",
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
      <span className="font-semibold">{formattedValue}</span>
    </div>
  );
};