-- Migration: Archive existing users and data for product pivot (v2 - handles existing tables)
-- Keeps users with 'scott' in their email, archives all others

-- Step 1: Drop existing archive tables if they exist
DROP TABLE IF EXISTS public.archived_detections CASCADE;
DROP TABLE IF EXISTS public.archived_price_alerts CASCADE;
DROP TABLE IF EXISTS public.archived_card_details CASCADE;
DROP TABLE IF EXISTS public.archived_watchlist CASCADE;
DROP TABLE IF EXISTS public.archived_email_tracking CASCADE;
DROP TABLE IF EXISTS public.archived_support_requests CASCADE;
DROP TABLE IF EXISTS public.archived_shared_access CASCADE;
DROP TABLE IF EXISTS public.archived_scan_usage CASCADE;
DROP TABLE IF EXISTS public.archived_user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.archived_items CASCADE;
DROP TABLE IF EXISTS public.archived_locations CASCADE;
DROP TABLE IF EXISTS public.archived_user_roles CASCADE;
DROP TABLE IF EXISTS public.archived_users CASCADE;

-- Step 2: Create archive tables with metadata

CREATE TABLE public.archived_users (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamp with time zone,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_items (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  location_id uuid,
  name text NOT NULL,
  image_url text,
  back_image_url text,
  category text,
  quantity integer,
  cost numeric,
  sold boolean,
  sold_price numeric,
  sold_date date,
  acquired_date date,
  expiry_date date,
  source_context text,
  created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_locations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  gps_lat numeric,
  gps_lng numeric,
  share_token text,
  created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_card_details (
  id uuid PRIMARY KEY,
  item_id uuid NOT NULL,
  player_name text,
  card_year integer,
  set_name text,
  brand text,
  card_number text,
  sport text,
  condition text,
  is_graded boolean,
  grading_company text,
  grade numeric,
  special_attributes text[],
  estimated_value numeric,
  last_price_update timestamp with time zone,
  price_trend_7d numeric,
  price_trend_30d numeric,
  last_sale_date timestamp with time zone,
  last_sale_price numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_user_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_tier subscription_tier NOT NULL,
  status text NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_scan_usage (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  items_detected integer NOT NULL,
  bonus_items integer NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_shared_access (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  location_id uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_support_requests (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_email_tracking (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  email_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_watchlist (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  card_id text NOT NULL,
  card_name text,
  player text,
  sport text,
  created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_price_alerts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  card_id uuid NOT NULL,
  alert_type text NOT NULL,
  threshold_amount numeric,
  threshold_percentage numeric,
  is_active boolean,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_detections (
  id uuid PRIMARY KEY,
  item_id uuid NOT NULL,
  label text NOT NULL,
  confidence numeric,
  bbox_x numeric,
  bbox_y numeric,
  bbox_width numeric,
  bbox_height numeric,
  created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

CREATE TABLE public.archived_user_roles (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text NOT NULL DEFAULT 'Product pivot - service discontinued'
);

-- Step 3: Copy data to archive tables (only for non-Scott users)

INSERT INTO public.archived_users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE email NOT ILIKE '%scott%';

INSERT INTO public.archived_user_roles (id, user_id, role, created_at)
SELECT id, user_id, role, created_at
FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_items (id, user_id, location_id, name, image_url, back_image_url, category, quantity, cost, sold, sold_price, sold_date, acquired_date, expiry_date, source_context, created_at)
SELECT id, user_id, location_id, name, image_url, back_image_url, category, quantity, cost, sold, sold_price, sold_date, acquired_date, expiry_date, source_context, created_at
FROM public.items
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_card_details (id, item_id, player_name, card_year, set_name, brand, card_number, sport, condition, is_graded, grading_company, grade, special_attributes, estimated_value, last_price_update, price_trend_7d, price_trend_30d, last_sale_date, last_sale_price, created_at, updated_at)
SELECT cd.id, cd.item_id, cd.player_name, cd.card_year, cd.set_name, cd.brand, cd.card_number, cd.sport, cd.condition, cd.is_graded, cd.grading_company, cd.grade, cd.special_attributes, cd.estimated_value, cd.last_price_update, cd.price_trend_7d, cd.price_trend_30d, cd.last_sale_date, cd.last_sale_price, cd.created_at, cd.updated_at
FROM public.card_details cd
JOIN public.items i ON cd.item_id = i.id
WHERE i.user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_detections (id, item_id, label, confidence, bbox_x, bbox_y, bbox_width, bbox_height, created_at)
SELECT d.id, d.item_id, d.label, d.confidence, d.bbox_x, d.bbox_y, d.bbox_width, d.bbox_height, d.created_at
FROM public.detections d
JOIN public.items i ON d.item_id = i.id
WHERE i.user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_price_alerts (id, user_id, card_id, alert_type, threshold_amount, threshold_percentage, is_active, last_triggered_at, created_at)
SELECT id, user_id, card_id, alert_type, threshold_amount, threshold_percentage, is_active, last_triggered_at, created_at
FROM public.price_alerts
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_locations (id, user_id, name, gps_lat, gps_lng, share_token, created_at)
SELECT id, user_id, name, gps_lat, gps_lng, share_token, created_at
FROM public.locations
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_shared_access (id, user_id, location_id, granted_at)
SELECT id, user_id, location_id, granted_at
FROM public.shared_access
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_user_subscriptions (id, user_id, plan_tier, status, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, created_at, updated_at)
SELECT id, user_id, plan_tier, status, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, created_at, updated_at
FROM public.user_subscriptions
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_scan_usage (id, user_id, items_detected, bonus_items, period_start, period_end, created_at, updated_at)
SELECT id, user_id, items_detected, bonus_items, period_start, period_end, created_at, updated_at
FROM public.scan_usage
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_support_requests (id, user_id, user_email, type, message, status, created_at, updated_at)
SELECT id, user_id, user_email, type, message, status, created_at, updated_at
FROM public.support_requests
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_email_tracking (id, user_id, email_type, sent_at, created_at)
SELECT id, user_id, email_type, sent_at, created_at
FROM public.email_tracking
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

INSERT INTO public.archived_watchlist (id, user_id, card_id, card_name, player, sport, created_at)
SELECT id, user_id, card_id, card_name, player, sport, created_at
FROM public.watchlist
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

-- Step 4: Delete archived data from active tables (in correct order for foreign keys)

DELETE FROM public.price_alerts
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.detections
WHERE item_id IN (
  SELECT id FROM public.items 
  WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%')
);

DELETE FROM public.card_details
WHERE item_id IN (
  SELECT id FROM public.items 
  WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%')
);

DELETE FROM public.items
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.shared_access
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.email_tracking
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.watchlist
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.locations
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.scan_usage
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.user_subscriptions
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.support_requests
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE '%scott%');

DELETE FROM auth.users
WHERE email NOT ILIKE '%scott%';

-- Step 5: Enable RLS on archive tables and create admin-only policies

ALTER TABLE public.archived_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_card_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view archived users" ON public.archived_users FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived items" ON public.archived_items FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived locations" ON public.archived_locations FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived card details" ON public.archived_card_details FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived subscriptions" ON public.archived_user_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived scan usage" ON public.archived_scan_usage FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived shared access" ON public.archived_shared_access FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived support requests" ON public.archived_support_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived email tracking" ON public.archived_email_tracking FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived watchlist" ON public.archived_watchlist FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived price alerts" ON public.archived_price_alerts FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived detections" ON public.archived_detections FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view archived user roles" ON public.archived_user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));