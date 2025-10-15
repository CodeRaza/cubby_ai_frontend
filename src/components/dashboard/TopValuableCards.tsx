import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TopCard {
  id: string;
  name: string;
  value: number;
  image_url: string;
  price_trend_7d?: number;
  is_graded?: boolean;
  special_attributes?: string[];
}

interface TopValuableCardsProps {
  cards: TopCard[];
  isLoading?: boolean;
}

export const TopValuableCards = ({ cards, isLoading }: TopValuableCardsProps) => {
  const navigate = useNavigate();
  const [watchedCards, setWatchedCards] = useState<Set<string>>(new Set());

  const toggleWatch = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Valuable Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Valuable Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No cards with pricing data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Valuable Cards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cards.map((card, index) => {
          const isWatched = watchedCards.has(card.id);
          const trend = card.price_trend_7d || 0;
          const isPositive = trend >= 0;

          return (
            <div
              key={card.id}
              onClick={() => navigate(`/item/${card.id}`)}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
            >
              <div className="flex-shrink-0 relative">
                <img
                  src={card.image_url || '/placeholder.svg'}
                  alt={card.name}
                  className="w-16 h-16 object-cover rounded"
                />
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-yellow-500">
                    1
                  </Badge>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate flex-1">{card.name}</h4>
                  <div className="flex items-center gap-1">
                    {card.is_graded && (
                      <Badge variant="secondary" className="text-xs h-5">Graded</Badge>
                    )}
                    {card.special_attributes?.includes('Rookie') && (
                      <Badge variant="outline" className="text-xs h-5">🌟 RC</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">${card.value.toFixed(2)}</span>
                    {trend !== 0 && (
                      <Badge variant={isPositive ? "default" : "destructive"} className="h-5 gap-1">
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="text-xs">{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => toggleWatch(card.id, e)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isWatched ? (
                      <Bell className="h-4 w-4 text-primary fill-primary" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
