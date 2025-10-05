-- Fix search_path for get_scan_limit function
DROP FUNCTION IF EXISTS public.get_scan_limit(subscription_tier);

CREATE OR REPLACE FUNCTION public.get_scan_limit(tier subscription_tier)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 250
    WHEN 'power' THEN 1000
  END;
END;
$$;