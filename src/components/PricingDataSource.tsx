import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PricingDataSourceProps {
  hasSalesData: boolean;
  lastPriceUpdate?: string;
  isQueued: boolean;
  queueStatus?: {
    status: string;
    priority: number;
    created_at: string;
  };
}

export const PricingDataSource = ({ 
  hasSalesData, 
  lastPriceUpdate, 
  isQueued,
  queueStatus 
}: PricingDataSourceProps) => {
  // If queued, show pending status
  if (isQueued && queueStatus) {
    return (
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Clock className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-sm">
          <div className="flex items-center justify-between">
            <div>
              <strong className="font-semibold">Fetching Live Market Data</strong>
              <p className="text-xs text-muted-foreground mt-1">
                Queued {formatDistanceToNow(new Date(queueStatus.created_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className="text-amber-500 border-amber-500/50">
              Priority {queueStatus.priority}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If we have real eBay sales data
  if (hasSalesData && lastPriceUpdate) {
    return (
      <Alert className="border-emerald-500/50 bg-emerald-500/10">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <AlertDescription className="text-sm">
          <div className="flex items-center justify-between">
            <div>
              <strong className="font-semibold text-emerald-700 dark:text-emerald-400">Live Market Data</strong>
              <p className="text-xs text-muted-foreground mt-1">
                Based on recent eBay sales • Updated {formatDistanceToNow(new Date(lastPriceUpdate), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">
              Live
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If using fallback/estimated pricing
  return (
    <Alert className="border-blue-500/50 bg-blue-500/10">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-sm">
        <div className="flex items-center justify-between">
          <div>
            <strong className="font-semibold text-blue-700 dark:text-blue-400">Estimated Value</strong>
            <p className="text-xs text-muted-foreground mt-1">
              Market data unavailable • Based on card age, brand, and attributes
            </p>
          </div>
          <Badge variant="outline" className="text-blue-500 border-blue-500/50">
            Estimated
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
};
