import { Star, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { MarketCard } from "@/pages/Market";

interface CardDetailsModalProps {
  card: MarketCard;
  isWatchlisted: boolean;
  onToggleWatchlist: (cardId: string) => void;
  onClose: () => void;
}

// Sample recent sales data
const generateRecentSales = (basePrice: number) => [
  { date: "2024-01-15", price: basePrice + 10, platform: "eBay", grade: 9.5 },
  { date: "2024-01-14", price: basePrice - 5, platform: "PWCC", grade: 9.0 },
  { date: "2024-01-13", price: basePrice + 15, platform: "eBay", grade: 10 },
  { date: "2024-01-12", price: basePrice, platform: "Goldin", grade: 9.5 },
  { date: "2024-01-11", price: basePrice - 8, platform: "eBay", grade: 9.0 },
];

export const CardDetailsModal = ({
  card,
  isWatchlisted,
  onToggleWatchlist,
  onClose
}: CardDetailsModalProps) => {
  const isPositive = card.changePercent >= 0;
  const recentSales = generateRecentSales(card.avgPrice);

  const handleSellOnEbay = () => {
    const searchQuery = encodeURIComponent(`${card.year} ${card.brand} ${card.player}`);
    window.open(`https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`, "_blank");
  };

  const handleViewAuctions = () => {
    const searchQuery = encodeURIComponent(`${card.year} ${card.brand} ${card.player}`);
    window.open(`https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&LH_Auction=1`, "_blank");
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl">{card.player}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {card.year} {card.brand} • {card.sport}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleWatchlist(card.id)}
            >
              <Star
                className={`h-5 w-5 ${
                  isWatchlisted ? "fill-yellow-400 text-yellow-400" : ""
                }`}
              />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Card Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative">
              <img
                src={card.imageUrl}
                alt={`${card.player} - ${card.name}`}
                className="w-full h-full object-cover"
              />
              {card.isGraded && (
                <Badge className="absolute top-4 left-4 bg-primary">
                  {card.gradingCompany} {card.grade}
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full bg-[#00C46C] hover:bg-[#00C46C]/90"
                onClick={handleSellOnEbay}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Sell on eBay
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleViewAuctions}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live Auctions
              </Button>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            {/* Price Information */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    ${card.currentPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Market Price</p>
                </div>
                <div
                  className={`flex items-center gap-1 text-lg font-semibold ${
                    isPositive ? "text-[#00C46C]" : "text-red-600"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {card.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Average Price</p>
                  <p className="text-lg font-semibold">
                    ${card.avgPrice.toLocaleString()}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Last Sale</p>
                  <p className="text-lg font-semibold">
                    ${card.lastSale.toLocaleString()}
                  </p>
                </Card>
              </div>

              <Card className="p-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">24h Change</p>
                  <p
                    className={`text-lg font-semibold ${
                      isPositive ? "text-[#00C46C]" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}${Math.abs(card.change24h).toFixed(2)}
                  </p>
                </div>
              </Card>
            </div>

            <Separator />

            {/* Recent Sales */}
            <div className="space-y-3">
              <h3 className="font-semibold">Recent Sales</h3>
              <div className="space-y-2">
                {recentSales.map((sale, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">${sale.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString()} • {sale.platform}
                        </p>
                      </div>
                      {card.isGraded && (
                        <Badge variant="outline">Grade {sale.grade}</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Market Stats */}
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="font-medium">{card.volume24h} sales</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sport</span>
                  <Badge variant="outline">{card.sport}</Badge>
                </div>
                {card.isGraded && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Grading</span>
                    <span className="font-medium">
                      {card.gradingCompany} {card.grade}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
