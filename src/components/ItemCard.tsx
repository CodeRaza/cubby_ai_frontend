import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";

interface ItemCardProps {
  name: string;
  category?: string;
  quantity: number;
  imageUrl?: string;
  locationName?: string;
  onClick: () => void;
}

export const ItemCard = ({ 
  name, 
  category, 
  quantity, 
  imageUrl, 
  locationName,
  onClick 
}: ItemCardProps) => {
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
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold truncate">{name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Qty: {quantity}
            </span>
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