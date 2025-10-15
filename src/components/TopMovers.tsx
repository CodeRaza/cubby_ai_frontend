import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface TopMover {
  id: string;
  name: string;
  image_url: string;
  estimated_value: number;
  price_trend_7d: number;
}

export const TopMovers = () => {
  const navigate = useNavigate();
  
  const { data: movers, isLoading } = useQuery({
    queryKey: ['top-movers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: items, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          image_url,
          card_details!inner(
            estimated_value,
            price_trend_7d
          )
        `)
        .eq('user_id', user.id)
        .eq('source_context', 'sports-cards')
        .not('card_details.price_trend_7d', 'is', null)
        .not('card_details.estimated_value', 'is', null)
        .order('card_details(price_trend_7d)', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Flatten and sort by absolute trend value
      const flattened = items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        estimated_value: item.card_details.estimated_value,
        price_trend_7d: item.card_details.price_trend_7d
      })) || [];

      return flattened.sort((a, b) => 
        Math.abs(b.price_trend_7d) - Math.abs(a.price_trend_7d)
      ).slice(0, 5);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Movers (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!movers || movers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Movers (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough pricing data yet. Check back after your cards have been scanned!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Movers (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {movers.map((mover) => {
            const isPositive = mover.price_trend_7d > 0;
            return (
              <div
                key={mover.id}
                onClick={() => navigate(`/item/${mover.id}`)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {mover.image_url ? (
                    <img 
                      src={mover.image_url} 
                      alt={mover.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mover.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${Number(mover.estimated_value).toFixed(2)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 font-semibold text-sm ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(mover.price_trend_7d).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
