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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-xl">🔥</span>
          Top Movers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {movers.map((mover) => {
            const isPositive = mover.changeAmount >= 0;
            return (
              <div
                key={mover.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate(`/item/${mover.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{mover.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${mover.currentValue.toFixed(0)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                    isPositive ? "text-[#00C853]" : "text-[#D32F2F]"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {isPositive ? "+" : ""}${Math.abs(mover.changeAmount).toFixed(0)}
                  <span className="text-xs">
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
