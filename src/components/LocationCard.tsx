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
      className="cursor-pointer card-shadow border-border/50 hover:border-border transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
            {emoji ? (
              <span className="text-xl sm:text-2xl">{emoji}</span>
            ) : (
              <LocationIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-visible">
            <h3 className="font-semibold text-base sm:text-lg mb-2">{name}</h3>
            {isSportsCards && collectionStats ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold">${collectionStats.total_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    {!isNeutral && (
                      <Badge 
                        variant="outline"
                        className={`gap-1 text-xs sm:text-sm border-none ${
                          isPositive 
                            ? 'bg-success/15 text-success' 
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {isPositive ? '+' : ''}{collectionStats.weekly_change_percent.toFixed(1)}%
                      </Badge>
                    )}
                   </div>
                   <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                     {collectionStats.card_count} cards • {isPositive ? '+' : ''}{collectionStats.weekly_change >= 0 ? '$' : '-$'}{Math.abs(collectionStats.weekly_change).toLocaleString('en-US', { maximumFractionDigits: 0 })} this week
                   </span>
                 </div>
                 {collectionStats.top_mover && (
                   <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                     Top: <span className="font-medium text-foreground">{collectionStats.top_mover.name}</span>
                     <span className={isPositive ? 'text-success font-medium' : 'text-danger font-medium'}>
                       {' '}{isPositive ? '↑' : '↓'} ${Math.abs(collectionStats.top_mover.change_amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
          <div className="flex gap-0 shrink-0 self-start ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={onQRClick}
            >
              <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={onRenameClick}
            >
              <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
              onClick={onDeleteClick}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        {/* Sparkline for sports cards */}
        {isSportsCards && collectionStats && collectionStats.sparkline_data.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
            <MiniSparkline data={collectionStats.sparkline_data} isNeutral={isNeutral} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};