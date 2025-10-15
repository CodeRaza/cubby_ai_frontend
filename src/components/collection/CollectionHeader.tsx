import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CollectionHeaderProps {
  name: string;
  totalValue: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  cardCount: number;
}

export const CollectionHeader = ({
  name,
  totalValue,
  weeklyChange,
  weeklyChangePercent,
  monthlyChange,
  monthlyChangePercent,
  cardCount,
}: CollectionHeaderProps) => {
  const isWeeklyPositive = weeklyChange >= 0;
  const isMonthlyPositive = monthlyChange >= 0;
  const isWeeklyNeutral = Math.abs(weeklyChangePercent) < 0.1;
  const isMonthlyNeutral = Math.abs(monthlyChangePercent) < 0.1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">{name}</h1>
        <p className="text-sm text-muted-foreground">{cardCount} cards</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-5xl font-bold">${totalValue.toFixed(0)}</span>
        </div>

        <div className="flex gap-4 flex-wrap">
          {/* 7-day change */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">7-day:</span>
                  {!isWeeklyNeutral && (
                    <Badge
                      variant="outline"
                      className={`gap-1 border-none ${
                        isWeeklyPositive
                          ? "bg-[#00C853]/15 text-[#00C853]"
                          : "bg-[#D32F2F]/15 text-[#D32F2F]"
                      }`}
                    >
                      {isWeeklyPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isWeeklyPositive ? "+" : ""}${Math.abs(weeklyChange).toFixed(0)}{" "}
                      ({isWeeklyPositive ? "+" : ""}
                      {weeklyChangePercent.toFixed(1)}%)
                    </Badge>
                  )}
                  {isWeeklyNeutral && (
                    <Badge variant="outline" className="gap-1 border-none bg-muted text-muted-foreground">
                      <Minus className="h-3 w-3" />
                      Flat
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change over last 7 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 30-day change */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">30-day:</span>
                  {!isMonthlyNeutral && (
                    <Badge
                      variant="outline"
                      className={`gap-1 border-none ${
                        isMonthlyPositive
                          ? "bg-[#00C853]/15 text-[#00C853]"
                          : "bg-[#D32F2F]/15 text-[#D32F2F]"
                      }`}
                    >
                      {isMonthlyPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isMonthlyPositive ? "+" : ""}${Math.abs(monthlyChange).toFixed(0)}{" "}
                      ({isMonthlyPositive ? "+" : ""}
                      {monthlyChangePercent.toFixed(1)}%)
                    </Badge>
                  )}
                  {isMonthlyNeutral && (
                    <Badge variant="outline" className="gap-1 border-none bg-muted text-muted-foreground">
                      <Minus className="h-3 w-3" />
                      Flat
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change over last 30 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
