import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Package, MapPin, Scan, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Analytics {
  total_users: number;
  users_this_month: number;
  total_items: number;
  items_this_month: number;
  total_locations: number;
  active_users_today: number;
  free_users: number;
  paid_users: number;
  scans_this_month: number;
}

interface UserStat {
  user_id: string;
  email: string;
  created_at: string;
  item_count: number;
  location_count: number;
  scan_count: number;
  plan_tier: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !roles) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadDashboardData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc("get_admin_analytics");

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData as unknown as Analytics);

      // Get user stats
      const { data: usersData, error: usersError } = await supabase
        .rpc("get_user_stats");

      if (usersError) throw usersError;
      setUserStats(usersData || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      starter: "bg-blue-500",
      pro: "bg-purple-500",
      power: "bg-orange-500"
    };
    return colors[tier] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Monitor platform metrics and user activity</p>
            </div>
          </div>
          <Button onClick={loadDashboardData} disabled={loading}>
            Refresh Data
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading dashboard data...</div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {analytics?.users_this_month || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_items || 0}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {analytics?.items_this_month || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.active_users_today || 0}</div>
                  <p className="text-xs text-muted-foreground">Users active today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scans This Month</CardTitle>
                  <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.scans_this_month || 0}</div>
                  <p className="text-xs text-muted-foreground">Items detected</p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>Breakdown of user plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Free Users</p>
                      <p className="text-2xl font-bold">{analytics?.free_users || 0}</p>
                    </div>
                    <Badge variant="secondary">Free</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Paid Users</p>
                      <p className="text-2xl font-bold">{analytics?.paid_users || 0}</p>
                    </div>
                    <Badge>Paid</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Detailed user statistics and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Locations</TableHead>
                      <TableHead className="text-right">Scans</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getTierColor(user.plan_tier)}>
                            {user.plan_tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{user.item_count}</TableCell>
                        <TableCell className="text-right">{user.location_count}</TableCell>
                        <TableCell className="text-right">{user.scan_count}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;