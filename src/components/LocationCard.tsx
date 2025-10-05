import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, QrCode } from "lucide-react";

interface LocationCardProps {
  id: string;
  name: string;
  itemCount: number;
  onClick: () => void;
  onQRClick: (e: React.MouseEvent) => void;
}

export const LocationCard = ({ id, name, itemCount, onClick, onQRClick }: LocationCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onQRClick}
            className="shrink-0"
          >
            <QrCode className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};