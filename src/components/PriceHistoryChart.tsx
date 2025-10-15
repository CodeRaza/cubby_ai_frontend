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
    price: Number(item.price)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History ({days} days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};