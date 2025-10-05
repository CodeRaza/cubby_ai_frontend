-- Drop the insecure view
DROP VIEW IF EXISTS public.admin_analytics;

-- Create a secure function to get analytics instead
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'users_this_month', (SELECT COUNT(*) FROM auth.users WHERE created_at >= date_trunc('month', now())),
    'total_items', (SELECT COUNT(*) FROM items),
    'items_this_month', (SELECT COUNT(*) FROM items WHERE created_at >= date_trunc('month', now())),
    'total_locations', (SELECT COUNT(*) FROM locations),
    'active_users_today', (SELECT COUNT(DISTINCT user_id) FROM items WHERE created_at >= date_trunc('day', now())),
    'free_users', (SELECT COUNT(*) FROM user_subscriptions WHERE plan_tier = 'free'),
    'paid_users', (SELECT COUNT(*) FROM user_subscriptions WHERE plan_tier IN ('starter', 'pro', 'power')),
    'scans_this_month', (SELECT COALESCE(SUM(items_detected), 0) FROM scan_usage WHERE period_start >= date_trunc('month', now()))
  )
  WHERE public.has_role(auth.uid(), 'admin');
$$;