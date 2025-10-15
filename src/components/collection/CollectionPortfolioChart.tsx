import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TimeRangeSelector, TimeRange } from "@/components/dashboard/TimeRangeSelector";
import { useState } from "react";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface CollectionPortfolioChartProps {
  data: ChartDataPoint[];
}

export const CollectionPortfolioChart = ({ data }: CollectionPortfolioChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  if (!data || data.length === 0) {
    return null;
  }

  const startValue = data[0]?.value || 0;
  const endValue = data[data.length - 1]?.value || 0;
  const changePercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  
  const isPositiveTrend = changePercent > 0.5;
  const isNegativeTrend = changePercent < -0.5;
  const isNeutral = !isPositiveTrend && !isNegativeTrend;

  // Get display label based on time range
  const getChartTitle = () => {
    switch (timeRange) {
      case '1D': return '1-Day Performance';
      case '1W': return '7-Day Performance';
      case '1M': return '30-Day Performance';
      case '3M': return '3-Month Performance';
      case 'YTD': return 'Year-to-Date Performance';
      case 'All': return 'All-Time Performance';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold">{getChartTitle()}</CardTitle>
          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        </div>
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
                formatter={(value: number) => [`$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, "Value"]}
                labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <defs>
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={
                  isPositiveTrend 
                    ? "url(#positiveGradient)" 
                    : isNegativeTrend 
                    ? "url(#negativeGradient)" 
                    : "url(#neutralGradient)"
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={
                  isPositiveTrend 
                    ? "hsl(var(--success))" 
                    : isNegativeTrend 
                    ? "hsl(var(--danger))" 
                    : "hsl(var(--muted-foreground))"
                }
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
