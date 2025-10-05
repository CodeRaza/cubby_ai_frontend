import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationCardProps {
  name: string;
  itemCount: number;
  onClick: () => void;
}

export const LocationCard = ({ name, itemCount, onClick }: LocationCardProps) => {
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
        </div>
      </CardContent>
    </Card>
  );
};