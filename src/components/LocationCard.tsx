import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QrCode, Trash2, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { getLocationIcon, getLocationEmoji } from "@/lib/locationTypes";
import { MiniSparkline } from "@/components/MiniSparkline";

interface CollectionStats {
  location_id: string;
  total_value: number;
  card_count: number;
  weekly_change: number;
  weekly_change_percent: number;
  top_mover?: {
    name: string;
    change_amount: number;
  };
  sparkline_data: number[];
}

interface LocationCardProps {
  id: string;
  name: string;
  itemCount: number;
  collectionStats?: CollectionStats;
  isSportsCards?: boolean;
  onClick: () => void;
  onQRClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  onRenameClick: (e: React.MouseEvent) => void;
}

export const LocationCard = ({ 
  id, 
  name, 
  itemCount, 
  collectionStats,
  isSportsCards = false,
  onClick, 
  onQRClick, 
  onDeleteClick, 
  onRenameClick 
}: LocationCardProps) => {
  const LocationIcon = getLocationIcon(name);
  const emoji = getLocationEmoji(name);
  
  const isPositive = collectionStats ? collectionStats.weekly_change >= 0 : true;
  const isNeutral = collectionStats ? Math.abs(collectionStats.weekly_change_percent) < 0.1 : true;
  
  return (
    <Card 
      className="cursor-pointer card-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 flex items-center justify-center">
            {emoji ? (
              <span className="text-3xl">{emoji}</span>
            ) : (
              <LocationIcon className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">{name}</h3>
            {isSportsCards && collectionStats ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-bold">${collectionStats.total_value.toFixed(0)}</span>
                  {!isNeutral && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline"
                            className={`gap-1 text-xs border-none ${
                              isPositive 
                                ? 'bg-[#00C853]/15 text-[#00C853]' 
                                : 'bg-[#D32F2F]/15 text-[#D32F2F]'
                            }`}
                          >
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isPositive ? '+' : ''}{collectionStats.weekly_change_percent.toFixed(1)}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Change over last 7 days</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {collectionStats.card_count} cards
                </span>
                {collectionStats.top_mover && (
                  <p className="text-xs text-muted-foreground">
                    Top: <span className="font-medium text-foreground">{collectionStats.top_mover.name}</span>
                    <span className={isPositive ? 'text-success' : 'text-danger'}>
                      {' '}{isPositive ? '↑' : '↓'} ${Math.abs(collectionStats.top_mover.change_amount).toFixed(0)}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onQRClick}
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRenameClick}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteClick}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Sparkline for sports cards */}
        {isSportsCards && collectionStats && collectionStats.sparkline_data.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <MiniSparkline data={collectionStats.sparkline_data} isNeutral={isNeutral} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};