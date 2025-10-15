-- Update the item limit function to return 10 for free tier
CREATE OR REPLACE FUNCTION public.get_item_limit(tier subscription_tier)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 10         -- 10 scans total (not per month!)
    WHEN 'starter' THEN 100     -- 100 scans per month
    WHEN 'pro' THEN 1000        -- 1000 scans per month
    WHEN 'investor' THEN 5000   -- 5000 scans per month
  END;
END;
$function$;

-- Create function to check if user can create a location (1 location limit for free tier)
CREATE OR REPLACE FUNCTION public.can_user_create_location(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_location_count INTEGER;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription, they're on free tier
  IF NOT FOUND THEN
    v_subscription.plan_tier := 'free';
  END IF;
  
  -- Count user's locations
  SELECT COUNT(*) INTO v_location_count
  FROM locations
  WHERE user_id = p_user_id;
  
  -- Free tier can only have 1 location/collection
  IF v_subscription.plan_tier = 'free' AND v_location_count >= 1 THEN
    RETURN FALSE;
  END IF;
  
  -- All other tiers have unlimited locations
  RETURN TRUE;
END;
$function$;

-- Update scan_usage to handle total scans (not monthly) for free tier
COMMENT ON COLUMN public.scan_usage.period_start IS 'For free tier: first scan date. For paid tiers: start of monthly period';
COMMENT ON COLUMN public.scan_usage.period_end IS 'For free tier: NULL (lifetime limit). For paid tiers: end of monthly period';

-- Update the can_user_add_items function to handle free tier lifetime limit
CREATE OR REPLACE FUNCTION public.can_user_add_items(p_user_id uuid, p_item_count integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_usage scan_usage%ROWTYPE;
  v_limit INTEGER;
  v_total_available INTEGER;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription, create free tier
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, plan_tier, status, current_period_start, current_period_end)
    VALUES (
      p_user_id,
      'free',
      'active',
      NOW(),
      NULL  -- Free tier has no end date
    )
    RETURNING * INTO v_subscription;
  END IF;
  
  -- For free tier: lifetime limit (no period)
  -- For paid tiers: monthly limit
  IF v_subscription.plan_tier = 'free' THEN
    v_period_start := v_subscription.current_period_start;
    v_period_end := NULL;
  ELSE
    v_period_start := date_trunc('month', now());
    v_period_end := date_trunc('month', now() + interval '1 month');
  END IF;
  
  -- Get current period usage
  IF v_subscription.plan_tier = 'free' THEN
    -- For free tier, get lifetime usage
    SELECT * INTO v_usage
    FROM scan_usage
    WHERE user_id = p_user_id
    ORDER BY created_at ASC
    LIMIT 1;
  ELSE
    -- For paid tiers, get current month's usage
    SELECT * INTO v_usage
    FROM scan_usage
    WHERE user_id = p_user_id
      AND period_start = v_period_start;
  END IF;
  
  -- If no usage record, create one
  IF NOT FOUND THEN
    INSERT INTO scan_usage (user_id, items_detected, bonus_items, period_start, period_end)
    VALUES (
      p_user_id,
      0,
      0,
      v_period_start,
      v_period_end
    )
    RETURNING * INTO v_usage;
  END IF;
  
  -- Get limit for user's tier
  v_limit := get_item_limit(v_subscription.plan_tier);
  v_total_available := v_limit + v_usage.bonus_items;
  
  -- Check if user has scans remaining for the requested count
  RETURN (v_usage.items_detected + p_item_count) <= v_total_available;
END;
$function$;

-- Update the increment_item_usage function to handle free tier
CREATE OR REPLACE FUNCTION public.increment_item_usage(p_user_id uuid, p_item_count integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_can_add BOOLEAN;
  v_subscription user_subscriptions%ROWTYPE;
  v_period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user can add items
  v_can_add := can_user_add_items(p_user_id, p_item_count);
  
  IF NOT v_can_add THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's subscription to determine period logic
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  IF v_subscription.plan_tier = 'free' THEN
    -- For free tier, update the single lifetime record
    UPDATE scan_usage
    SET items_detected = items_detected + p_item_count,
        updated_at = now()
    WHERE user_id = p_user_id
      AND period_end IS NULL;
  ELSE
    -- For paid tiers, update current month's record
    v_period_start := date_trunc('month', now());
    UPDATE scan_usage
    SET items_detected = items_detected + p_item_count,
        updated_at = now()
    WHERE user_id = p_user_id
      AND period_start = v_period_start;
  END IF;
  
  RETURN TRUE;
END;
$function$;