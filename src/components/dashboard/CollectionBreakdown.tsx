import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CollectionBreakdownProps {
  sportsBreakdown: Record<string, number>;
  totalValue: number;
  isLoading?: boolean;
}

const COLORS = ['hsl(var(--success))', 'hsl(150 45% 45%)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const CollectionBreakdown = ({ sportsBreakdown, totalValue, isLoading }: CollectionBreakdownProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(sportsBreakdown).map(([sport, count]) => ({
    name: sport,
    value: count,
    percentage: ((count / Object.values(sportsBreakdown).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No collection data yet</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} cards ({data.percentage}%)
          </p>
          <p className="text-sm font-medium">
            ~${((totalValue * parseFloat(data.percentage)) / 100).toFixed(0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
