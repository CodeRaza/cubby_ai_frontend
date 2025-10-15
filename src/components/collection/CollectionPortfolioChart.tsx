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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">30-Day Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => format(new Date(value), "MMM d")}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(0)}`, "Value"]}
              labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositiveTrend ? "#4B9CE2" : "#E0E0E0"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
