import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ApiCall {
  id: string;
  endpoint: string;
  operation: string;
  status: string;
  response_time_ms: number;
  error_message: string | null;
  user_id: string | null;
  card_key: string | null;
  created_at: string;
}

interface DailyStat {
  date: string;
  endpoint: string;
  operation: string;
  status: string;
  call_count: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  error_count: number;
}

export default function ApiUsage() {
  const navigate = useNavigate();
  const [recentCalls, setRecentCalls] = useState<ApiCall[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [todaysSummary, setTodaysSummary] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Admin access required");
      navigate("/dashboard");
    }
  };

  const fetchData = async (showToast = false) => {
    setLoading(true);
    try {
      // Fetch recent calls (last 100)
      const { data: calls, error: callsError } = await supabase
        .from("ebay_api_usage")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (callsError) throw callsError;
      setRecentCalls(calls || []);

      // Fetch daily stats
      const { data: stats, error: statsError } = await supabase
        .from("ebay_api_daily_stats")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (statsError) throw statsError;
      setDailyStats(stats || []);

      // Calculate today's summary
      const today = new Date().toISOString().split('T')[0];
      const todaysCalls = calls?.filter(call => 
        call.created_at.startsWith(today)
      ) || [];

      const successful = todaysCalls.filter(c => c.status === 'success').length;
      const failed = todaysCalls.filter(c => c.status === 'error').length;
      const avgTime = todaysCalls.length > 0
        ? todaysCalls.reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / todaysCalls.length
        : 0;

      setTodaysSummary({
        total: todaysCalls.length,
        successful,
        failed,
        avgResponseTime: Math.round(avgTime)
      });

      if (showToast) {
        toast.success("Usage data refreshed");
      }
    } catch (error) {
      console.error("Error fetching API usage:", error);
      toast.error("Failed to load API usage data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">eBay API Usage</h1>
            <p className="text-muted-foreground">Monitor your eBay Finding Service API calls</p>
          </div>
          <Button onClick={() => fetchData(true)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysSummary.total}</div>
              <p className="text-xs text-muted-foreground">
                Total API requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaysSummary.total > 0 
                  ? Math.round((todaysSummary.successful / todaysSummary.total) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {todaysSummary.successful} successful, {todaysSummary.failed} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysSummary.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{todaysSummary.failed}</div>
              <p className="text-xs text-muted-foreground">
                Failed requests today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Calls</TabsTrigger>
            <TabsTrigger value="daily">Daily Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
                <CardDescription>Last 100 eBay API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Card Key</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCalls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(call.created_at)}
                        </TableCell>
                        <TableCell>{call.operation}</TableCell>
                        <TableCell>
                          <Badge variant={call.status === 'success' ? 'default' : 'destructive'}>
                            {call.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{call.response_time_ms}ms</TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {call.card_key || '-'}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                          {call.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Statistics</CardTitle>
                <CardDescription>Aggregated stats by day</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Total Calls</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Min/Max Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.map((stat, idx) => (
                      <TableRow key={`${stat.date}-${stat.operation}-${idx}`}>
                        <TableCell className="font-medium">
                          {new Date(stat.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{stat.operation}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stat.call_count}</Badge>
                        </TableCell>
                        <TableCell>
                          {stat.error_count > 0 ? (
                            <Badge variant="destructive">{stat.error_count}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>{Math.round(stat.avg_response_time)}ms</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {Math.round(stat.min_response_time)}ms / {Math.round(stat.max_response_time)}ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
