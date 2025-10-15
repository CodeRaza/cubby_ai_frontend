import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopMover {
  id: string;
  name: string;
  currentValue: number;
  changeAmount: number;
  changePercent: number;
}

interface CollectionTopMoversProps {
  movers: TopMover[];
}

export const CollectionTopMovers = ({ movers }: CollectionTopMoversProps) => {
  const navigate = useNavigate();

  if (!movers || movers.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="text-xl">🔥</span>
          Top Movers
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {movers.map((mover) => {
            const isPositive = mover.changeAmount >= 0;
            return (
              <div
                key={mover.id}
                className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/30 cursor-pointer transition-all border border-border/30 hover:border-border/50"
                onClick={() => navigate(`/item/${mover.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{mover.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${mover.currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-sm ${
                    isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}${Math.abs(mover.changeAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs opacity-80">
                    ({isPositive ? "+" : ""}
                    {mover.changePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
