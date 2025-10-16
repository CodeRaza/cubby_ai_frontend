import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Clock, AlertCircle, RefreshCw, Zap, FileText, Database, TestTube, Calendar, BarChart3, Shield, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

  const triggerTestPricing = async () => {
    try {
      toast.loading("Triggering pricing update...");
      
      const { data, error } = await supabase.functions.invoke('trigger-pricing-update', {
        body: { cardDetailsId: '51da81bc-9ac7-4d72-8bd5-e681098d0a4a' } // Junior Caminero card
      });

      if (error) throw error;

      toast.success("Pricing update triggered! Refreshing data in 5 seconds...");
      
      // Wait and refresh
      setTimeout(() => {
        fetchData(true);
      }, 5000);
    } catch (error) {
      console.error("Error triggering pricing:", error);
      toast.error("Failed to trigger pricing update");
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
          <div className="flex gap-2">
            <Button onClick={triggerTestPricing} variant="outline" disabled={loading}>
              <Zap className="h-4 w-4 mr-2" />
              Test Pricing Call
            </Button>
            <Button onClick={() => fetchData(true)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
        <Tabs defaultValue="docs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="recent">Recent Calls</TabsTrigger>
            <TabsTrigger value="daily">Daily Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  eBay API Integration Overview
                </CardTitle>
                <CardDescription>
                  This application uses the eBay Finding Service v1 API to fetch real-time pricing data for sports cards. 
                  All API calls are logged and monitored to optimize usage and stay within rate limits.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Use Cases */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Current Use Cases</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Use Case 1: Queue-Based Pricing */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Queue-Based Pricing Updates</CardTitle>
                      </div>
                      <Badge variant="default">Direct API</Badge>
                    </div>
                    <CardDescription className="font-mono text-xs">process-pricing-queue</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-1">Purpose</p>
                      <p className="text-sm text-muted-foreground">
                        Processes batched pricing requests from a priority queue system
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Trigger Method</p>
                      <Badge variant="outline" className="text-xs">Automatic</Badge>
                      <Badge variant="outline" className="text-xs ml-1">Manual Invoke</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">API Endpoint</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">FindingService v1 - findCompletedItems</code>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Rate Limiting</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">2 second delay</Badge>
                        <Badge variant="secondary" className="text-xs">Batch size: 100</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Schedule</p>
                      <Badge variant="outline" className="text-xs">Daily at 3 AM</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Daily Quota</p>
                      <Badge className="text-xs bg-blue-500/20 text-blue-700 border-blue-500/30">Stops at 90% (360 calls)</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Priority Logic</p>
                      <p className="text-xs text-muted-foreground">
                        Processes high-priority cards first: graded cards, rookies, autographs, high-value cards
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Use Case 2: On-Demand Pricing */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">On-Demand Pricing Fetch</CardTitle>
                      </div>
                      <Badge variant="outline">Via Queue</Badge>
                    </div>
                    <CardDescription className="font-mono text-xs">fetch-card-pricing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-1">Purpose</p>
                      <p className="text-sm text-muted-foreground">
                        User-initiated pricing lookup with intelligent caching
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Trigger Method</p>
                      <Badge variant="outline" className="text-xs">User Action</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Cache Duration</p>
                      <Badge className="text-xs bg-green-500/20 text-green-700 border-green-500/30">7 days (168 hours)</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Optimization</p>
                      <p className="text-xs text-muted-foreground">
                        Returns cached data immediately if fresh; queues background job if stale
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Data Flow</p>
                      <p className="text-xs text-muted-foreground">
                        Adds job to pricing_queue → Processed by process-pricing-queue → Updates card_pricing_cache
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Use Case 3: Top Cards Refresh - Global Cache */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Global Cache Seeding (Top 20k)</CardTitle>
                      </div>
                      <Badge variant="default">Automated Daily</Badge>
                    </div>
                    <CardDescription className="font-mono text-xs">refresh-top-cards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-1">Purpose</p>
                      <p className="text-sm text-muted-foreground">
                        Maintains a global cache of the top 20,000 most valuable and popular cards. Provides instant pricing for 80%+ of user scans.
                      </p>
                    </div>
                    <div className="grid gap-2 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-700">✅ Fully Automated System</p>
                          <p className="text-xs text-muted-foreground">
                            Runs daily at 2 AM UTC. Automatically rotates through all 20k cards:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>Processes 100 cards per day (200 API calls)</li>
                            <li>Full rotation every 200 days</li>
                            <li>Leaves 4,800 API calls/day for user requests</li>
                            <li>Progress tracked in database</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Selection Criteria (Scored)</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                        <li>Top 2,000 highest value cards (1000 pts base score)</li>
                        <li>Queue frequency: +10 pts per request</li>
                        <li>User price alerts: +50 pts</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Rate Limiting</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">2 second delay</Badge>
                        <Badge variant="secondary" className="text-xs">Max 4,900 cards/run</Badge>
                        <Badge className="text-xs bg-green-500/20 text-green-700 border-green-500/30">Leaves 100 calls for queue</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Daily API Impact</p>
                      <p className="text-xs text-muted-foreground">
                        Uses 4,900 of 5,000 daily calls, reserving 100 for queue processing
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Use Case 4: Manual Test */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Manual Test/Debug</CardTitle>
                      </div>
                      <Badge variant="outline">Via Queue</Badge>
                    </div>
                    <CardDescription className="font-mono text-xs">trigger-pricing-update</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-1">Purpose</p>
                      <p className="text-sm text-muted-foreground">
                        Admin testing and debugging of pricing updates
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Trigger Method</p>
                      <Badge variant="outline" className="text-xs">Manual Button Click</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Priority</p>
                      <Badge className="text-xs">High (100)</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Test Card</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        Junior Caminero 2024 Bowman Chrome
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Usage</p>
                      <p className="text-xs text-muted-foreground">
                        Use the "Test Pricing Call" button above to trigger a test API call
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Rate Limiting Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Rate Limiting & Optimization Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="cache">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Caching Strategy
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        All pricing data is cached in the <code className="bg-muted px-1 rounded">card_pricing_cache</code> table
                        to minimize redundant API calls.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li><strong>Cache Duration:</strong> 7 days (168 hours)</li>
                        <li><strong>Cache Hit:</strong> Returns data instantly without API call</li>
                        <li><strong>Cache Miss:</strong> Queues pricing job for background processing</li>
                        <li><strong>Stale Data:</strong> Returns old data immediately, updates in background</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="delays">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Request Throttling
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Artificial delays are inserted between API calls to prevent rate limit violations.
                      </p>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Queue Processing (between cards)</span>
                          <Badge variant="secondary">2 second delay</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Top Cards Refresh (between cards)</span>
                          <Badge variant="secondary">2 second delay</Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="priority">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Priority Queue System
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Cards are scored and prioritized to ensure the most important cards are updated first.
                      </p>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-semibold mb-2">Priority Score Calculation:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                            <li>Graded cards: +50 points</li>
                            <li>Rookie cards: +30 points</li>
                            <li>Autographed cards: +30 points</li>
                            <li>Value {'>'} $100: +20 points</li>
                            <li>Value {'>'} $500: +30 points</li>
                            <li>Value {'>'} $1000: +40 points</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="batching">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Batch Processing
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        API calls are processed in controlled batches to prevent overwhelming the eBay API.
                      </p>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Queue Processing Batch Size</span>
                          <Badge variant="secondary">100 cards/day</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Queue Processing Schedule</span>
                          <Badge variant="secondary">Daily at 3 AM</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Global Cache Refresh Size</span>
                          <Badge variant="secondary">4,900 cards/run</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Global Cache Total Tracked</span>
                          <Badge variant="secondary">20,000 cards</Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Troubleshooting Common Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm mb-1">Rate Limit Exceeded</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Error: "Service call has exceeded the number of times the operation is allowed to be called"
                        </p>
                        <p className="text-xs mb-2"><strong>Cause:</strong> eBay API daily or per-minute rate limit hit</p>
                        <p className="text-xs"><strong>Solution:</strong></p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 ml-2">
                          <li>Wait for rate limit to reset (typically 24 hours for daily limit)</li>
                          <li>Review Recent Calls tab to identify patterns</li>
                          <li>Consider extending cache duration to reduce API calls</li>
                          <li>Increase delays between batch processing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm mb-1">Internal Server Error</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Error: "eBay API error: Internal Server Error"
                        </p>
                        <p className="text-xs mb-2"><strong>Cause:</strong> Temporary eBay API outage or maintenance</p>
                        <p className="text-xs"><strong>Solution:</strong></p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 ml-2">
                          <li>Retry the request after a few minutes</li>
                          <li>Check eBay API status page</li>
                          <li>Failed requests are automatically logged for review</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-blue-500/20 rounded-lg bg-blue-500/5">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm mb-1">Stale Pricing Data</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Pricing data appears outdated
                        </p>
                        <p className="text-xs mb-2"><strong>Cause:</strong> Cache is older than 7 days or recent API failures</p>
                        <p className="text-xs"><strong>Solution:</strong></p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 ml-2">
                          <li>Check Recent Calls tab for recent errors</li>
                          <li>Manually trigger pricing update for specific cards</li>
                          <li>Wait for next automatic top cards refresh cycle</li>
                          <li>Review Daily Stats to see overall API health</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Pro Tip:</strong> Use the tabs above to monitor API health. The "Recent Calls" tab shows
                      individual requests with error details, while "Daily Stats" provides aggregate metrics to identify trends.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
