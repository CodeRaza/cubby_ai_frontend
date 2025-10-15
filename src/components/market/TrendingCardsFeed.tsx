import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketCard } from "@/pages/Market";

interface TrendingCardsFeedProps {
  cards: MarketCard[];
  watchlist: Set<string>;
  onToggleWatchlist: (cardId: string) => void;
  onCardClick: (card: MarketCard) => void;
}

export const TrendingCardsFeed = ({
  cards,
  watchlist,
  onToggleWatchlist,
  onCardClick
}: TrendingCardsFeedProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trending Cards</h2>
        <p className="text-sm text-muted-foreground">{cards.length} cards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const isPositive = card.changePercent >= 0;
          const isWatchlisted = watchlist.has(card.id);

          return (
            <Card
              key={card.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onCardClick(card)}
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img
                  src={card.imageUrl}
                  alt={`${card.player} - ${card.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(card.id);
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${
                      isWatchlisted ? "fill-yellow-400 text-yellow-400" : ""
                    }`}
                  />
                </Button>
                {card.isGraded && (
                  <Badge className="absolute top-2 left-2 bg-primary/90">
                    {card.gradingCompany} {card.grade}
                  </Badge>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm line-clamp-1">{card.player}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {card.year} {card.brand}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      ${card.currentPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Current Price</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      isPositive ? "text-[#00C46C]" : "text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {card.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vol: {card.volume24h}</span>
                  <Badge variant="outline" className="text-xs">
                    {card.sport}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {cards.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No cards match your filters</p>
        </Card>
      )}
    </div>
  );
};
