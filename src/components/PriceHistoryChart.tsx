import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceHistoryChartProps {
  cardId: string;
  days?: 7 | 30;
}

export const PriceHistoryChart = ({ cardId, days = 7 }: PriceHistoryChartProps) => {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', cardId, days],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('card_id', cardId)
        .gte('date_of_sale', daysAgo.toISOString())
        .order('date_of_sale', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History ({days} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History ({days} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pricing data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = priceHistory.map(item => ({
    date: format(new Date(item.date_of_sale!), 'MMM dd'),
    fullDate: format(new Date(item.date_of_sale!), 'MMM dd, yyyy'),
    price: Number(item.price),
    source: item.source
  }));

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const avgPrice = chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Price History ({days} days)</CardTitle>
          <div className="text-sm text-muted-foreground">
            Avg: ${avgPrice.toFixed(2)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              domain={[Math.floor(minPrice * 0.9), Math.ceil(maxPrice * 1.1)]}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => {
                const point = chartData.find(d => d.date === label);
                return point ? `${point.fullDate} • ${point.source}` : label;
              }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="font-semibold text-sm">${minPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="font-semibold text-sm">${avgPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">High</p>
            <p className="font-semibold text-sm">${maxPrice.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};