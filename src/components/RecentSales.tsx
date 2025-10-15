import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentSalesProps {
  cardId: string;
  limit?: number;
}

export const RecentSales = ({ cardId, limit = 5 }: RecentSalesProps) => {
  const { data: sales, isLoading } = useQuery({
    queryKey: ['recent-sales', cardId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('card_id', cardId)
        .order('date_of_sale', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent eBay Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent eBay Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">
              No recent sales data available yet
            </p>
            <p className="text-xs text-muted-foreground">
              Click "Refresh Pricing" above to fetch live eBay sales data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average price from sales
  const avgPrice = sales.reduce((sum, sale) => sum + Number(sale.price), 0) / sales.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent eBay Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sales.map((sale) => (
            <div 
              key={sale.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    ${Number(sale.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase bg-background px-2 py-0.5 rounded">
                    {sale.source}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {sale.date_of_sale && format(new Date(sale.date_of_sale), 'MMM dd, yyyy')}
                  {sale.condition && ` • ${sale.condition}`}
                </div>
              </div>
              {sale.sale_url && (
                <a
                  href={sale.sale_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="View on eBay"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm font-medium">
            Average Market Value: ${avgPrice.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {sales.length} recent {sales.length === 1 ? 'sale' : 'sales'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};