import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import { formatCardTitle, formatCardSubtitle, getCardBadges } from "@/lib/cardFormatting";
import { PriceTrend } from "@/components/PriceTrend";

interface ItemCardProps {
  name: string;
  category?: string;
  quantity: number;
  imageUrl?: string;
  locationName?: string;
  onClick: () => void;
  cardDetails?: {
    player_name?: string;
    card_year?: number;
    brand?: string;
    card_number?: string;
    set_name?: string;
    condition?: string;
    is_graded?: boolean;
    grading_company?: string;
    grade?: number;
    special_attributes?: string[];
    estimated_value?: number;
    price_trend_7d?: number;
  };
}

export const ItemCard = ({ 
  name, 
  category, 
  quantity, 
  imageUrl, 
  locationName,
  onClick,
  cardDetails
}: ItemCardProps) => {
  const displayTitle = cardDetails ? formatCardTitle(name, cardDetails) : name;
  const subtitle = cardDetails ? formatCardSubtitle(cardDetails) : null;
  const badges = cardDetails ? getCardBadges(cardDetails) : [];

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Badge overlay */}
        {badges.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {badges.slice(0, 2).map((badge, idx) => (
              <span 
                key={idx}
                className="text-lg bg-background/90 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center shadow-md"
                title={badge.label}
              >
                {badge.icon}
              </span>
            ))}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {displayTitle}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {/* Price and trend for sports cards */}
          {cardDetails?.estimated_value ? (
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold transition-colors ${
                cardDetails.price_trend_7d && cardDetails.price_trend_7d > 0 
                  ? 'text-green-600' 
                  : cardDetails.price_trend_7d && cardDetails.price_trend_7d < 0 
                  ? 'text-red-600' 
                  : 'text-foreground'
              }`}>
                ${Number(cardDetails.estimated_value).toFixed(2)}
              </span>
              {cardDetails.price_trend_7d !== null && cardDetails.price_trend_7d !== undefined && (
                <PriceTrend value={cardDetails.price_trend_7d} />
              )}
            </div>
          ) : cardDetails && (
            <div className="text-xs text-muted-foreground">
              Pricing data pending...
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {category && !cardDetails && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {quantity > 1 && (
              <span className="text-xs text-muted-foreground">
                Qty: {quantity}
              </span>
            )}
          </div>
          {locationName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{locationName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};