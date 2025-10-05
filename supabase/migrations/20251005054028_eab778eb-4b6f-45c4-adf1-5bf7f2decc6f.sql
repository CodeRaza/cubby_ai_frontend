-- Update scan_usage table to track items instead of scans
ALTER TABLE scan_usage RENAME COLUMN scans_used TO items_detected;
ALTER TABLE scan_usage RENAME COLUMN bonus_credits TO bonus_items;

-- Update comments for clarity
COMMENT ON COLUMN scan_usage.items_detected IS 'Number of items detected (not scans/photos)';
COMMENT ON COLUMN scan_usage.bonus_items IS 'Bonus items from scan packs';

-- Add bounding box coordinates to detections table
ALTER TABLE detections 
ADD COLUMN bbox_x numeric,
ADD COLUMN bbox_y numeric,
ADD COLUMN bbox_width numeric,
ADD COLUMN bbox_height numeric;

COMMENT ON COLUMN detections.bbox_x IS 'X coordinate of bounding box (0-1, relative to image width)';
COMMENT ON COLUMN detections.bbox_y IS 'Y coordinate of bounding box (0-1, relative to image height)';
COMMENT ON COLUMN detections.bbox_width IS 'Width of bounding box (0-1, relative to image width)';
COMMENT ON COLUMN detections.bbox_height IS 'Height of bounding box (0-1, relative to image height)';

-- Update the get_scan_limit function to reflect new item-based limits
DROP FUNCTION IF EXISTS get_scan_limit(subscription_tier);

CREATE OR REPLACE FUNCTION public.get_item_limit(tier subscription_tier)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 50        -- 50 items per month
    WHEN 'starter' THEN 250    -- 250 items per month
    WHEN 'pro' THEN 1000       -- 1000 items per month
    WHEN 'power' THEN 5000     -- 5000 items per month
  END;
END;
$$;

-- Update can_user_scan function to check item limits
DROP FUNCTION IF EXISTS can_user_scan(uuid);

CREATE OR REPLACE FUNCTION public.can_user_add_items(p_user_id uuid, p_item_count integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_usage scan_usage%ROWTYPE;
  v_limit INTEGER;
  v_total_available INTEGER;
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
      date_trunc('month', now()),
      date_trunc('month', now() + interval '1 month')
    )
    RETURNING * INTO v_subscription;
  END IF;
  
  -- Get current period usage
  SELECT * INTO v_usage
  FROM scan_usage
  WHERE user_id = p_user_id
    AND period_start = date_trunc('month', now());
  
  -- If no usage record, create one
  IF NOT FOUND THEN
    INSERT INTO scan_usage (user_id, items_detected, bonus_items, period_start, period_end)
    VALUES (
      p_user_id,
      0,
      0,
      date_trunc('month', now()),
      date_trunc('month', now() + interval '1 month')
    )
    RETURNING * INTO v_usage;
  END IF;
  
  -- Get limit for user's tier
  v_limit := get_item_limit(v_subscription.plan_tier);
  v_total_available := v_limit + v_usage.bonus_items;
  
  -- Check if user has items remaining for the requested count
  RETURN (v_usage.items_detected + p_item_count) <= v_total_available;
END;
$$;

-- Update increment function to track items
DROP FUNCTION IF EXISTS increment_scan_usage(uuid);

CREATE OR REPLACE FUNCTION public.increment_item_usage(p_user_id uuid, p_item_count integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_can_add BOOLEAN;
BEGIN
  -- Check if user can add items
  v_can_add := can_user_add_items(p_user_id, p_item_count);
  
  IF NOT v_can_add THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage
  UPDATE scan_usage
  SET items_detected = items_detected + p_item_count,
      updated_at = now()
  WHERE user_id = p_user_id
    AND period_start = date_trunc('month', now());
  
  RETURN TRUE;
END;
$$;