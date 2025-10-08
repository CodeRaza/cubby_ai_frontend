-- Fix security warning for function search path
DROP FUNCTION IF EXISTS get_onboarding_funnel();

CREATE OR REPLACE FUNCTION get_onboarding_funnel()
RETURNS TABLE(
  total_signups bigint,
  completed_onboarding bigint,
  first_scan bigint,
  active_users bigint,
  avg_scans_per_user numeric,
  onboarding_conversion numeric,
  scan_conversion numeric,
  active_conversion numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_metrics AS (
    SELECT 
      u.id,
      u.created_at,
      COUNT(DISTINCT l.id) as location_count,
      COUNT(DISTINCT i.id) as item_count
    FROM auth.users u
    LEFT JOIN locations l ON l.user_id = u.id
    LEFT JOIN items i ON i.user_id = u.id
    GROUP BY u.id, u.created_at
  )
  SELECT 
    -- Total signups
    COUNT(*) as total_signups,
    
    -- Users who completed onboarding (created at least 1 location)
    COUNT(*) FILTER (WHERE location_count >= 1) as completed_onboarding,
    
    -- Users who did their first scan (have at least 1 item)
    COUNT(*) FILTER (WHERE item_count >= 1) as first_scan,
    
    -- Active users (5+ items)
    COUNT(*) FILTER (WHERE item_count >= 5) as active_users,
    
    -- Average scans per user (only users with items)
    ROUND(AVG(item_count) FILTER (WHERE item_count > 0), 2) as avg_scans_per_user,
    
    -- Conversion rates
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE location_count >= 1) / COUNT(*), 2)
      ELSE 0 
    END as onboarding_conversion,
    
    CASE 
      WHEN COUNT(*) FILTER (WHERE location_count >= 1) > 0 
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE item_count >= 1) / COUNT(*) FILTER (WHERE location_count >= 1), 2)
      ELSE 0 
    END as scan_conversion,
    
    CASE 
      WHEN COUNT(*) FILTER (WHERE item_count >= 1) > 0 
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE item_count >= 5) / COUNT(*) FILTER (WHERE item_count >= 1), 2)
      ELSE 0 
    END as active_conversion
  FROM user_metrics;
END;
$$;