-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin analytics view
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= date_trunc('month', now())) as users_this_month,
  (SELECT COUNT(*) FROM items) as total_items,
  (SELECT COUNT(*) FROM items WHERE created_at >= date_trunc('month', now())) as items_this_month,
  (SELECT COUNT(*) FROM locations) as total_locations,
  (SELECT COUNT(DISTINCT user_id) FROM items WHERE created_at >= date_trunc('day', now())) as active_users_today,
  (SELECT COUNT(*) FROM user_subscriptions WHERE plan_tier = 'free') as free_users,
  (SELECT COUNT(*) FROM user_subscriptions WHERE plan_tier IN ('starter', 'pro', 'power')) as paid_users,
  (SELECT COALESCE(SUM(items_detected), 0) FROM scan_usage WHERE period_start >= date_trunc('month', now())) as scans_this_month;

-- Grant access to admin analytics
CREATE POLICY "Admins can view analytics"
ON public.user_subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view scan usage"
ON public.scan_usage FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Function to get user stats
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  item_count BIGINT,
  location_count BIGINT,
  scan_count BIGINT,
  plan_tier subscription_tier
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id as user_id,
    u.email,
    u.created_at,
    COALESCE(i.item_count, 0) as item_count,
    COALESCE(l.location_count, 0) as location_count,
    COALESCE(s.scan_count, 0) as scan_count,
    COALESCE(sub.plan_tier, 'free'::subscription_tier) as plan_tier
  FROM auth.users u
  LEFT JOIN (SELECT user_id, COUNT(*) as item_count FROM items GROUP BY user_id) i ON u.id = i.user_id
  LEFT JOIN (SELECT user_id, COUNT(*) as location_count FROM locations GROUP BY user_id) l ON u.id = l.user_id
  LEFT JOIN (SELECT user_id, SUM(items_detected) as scan_count FROM scan_usage GROUP BY user_id) s ON u.id = s.user_id
  LEFT JOIN user_subscriptions sub ON u.id = sub.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at DESC;
$$;