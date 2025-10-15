import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface CollectionPortfolioChartProps {
  data: ChartDataPoint[];
}

export const CollectionPortfolioChart = ({ data }: CollectionPortfolioChartProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const isPositiveTrend = data.length >= 2 && data[data.length - 1].value >= data[0].value;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">30-Day Performance</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-chart rounded-2xl -z-10" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(0)}`, "Value"]}
                labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositiveTrend ? "hsl(var(--success))" : "hsl(var(--muted-foreground))"}
                strokeWidth={3}
                dot={false}
                fill="url(#lineGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
