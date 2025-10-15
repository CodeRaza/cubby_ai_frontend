-- Drop and recreate the get_users_needing_reminders function for 14-day email sequence
DROP FUNCTION IF EXISTS public.get_users_needing_reminders();

CREATE OR REPLACE FUNCTION public.get_users_needing_reminders()
RETURNS TABLE(
  user_id uuid,
  email text,
  days_since_signup integer,
  has_location boolean,
  has_items boolean,
  last_email_type text,
  item_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      u.id,
      u.email::text as email,
      EXTRACT(DAY FROM (NOW() - u.created_at))::INTEGER as days_since_signup,
      EXISTS(SELECT 1 FROM locations l WHERE l.user_id = u.id) as has_location,
      EXISTS(SELECT 1 FROM items i WHERE i.user_id = u.id) as has_items,
      (SELECT COUNT(*) FROM items i WHERE i.user_id = u.id)::INTEGER as item_count,
      (
        SELECT et.email_type 
        FROM email_tracking et 
        WHERE et.user_id = u.id 
        ORDER BY et.sent_at DESC 
        LIMIT 1
      ) as last_email_type
    FROM auth.users u
    WHERE u.created_at IS NOT NULL
  )
  SELECT 
    ud.id,
    ud.email,
    ud.days_since_signup,
    ud.has_location,
    ud.has_items,
    ud.last_email_type,
    ud.item_count
  FROM user_data ud
  WHERE 
    -- Day 1: Create first collection (if no location yet)
    (ud.days_since_signup >= 1 AND ud.days_since_signup < 2 
     AND NOT ud.has_location 
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day1_reminder'))
    OR
    -- Day 3: Start tracking values (if no items yet)
    (ud.days_since_signup >= 3 AND ud.days_since_signup < 4 
     AND NOT ud.has_items 
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day3_reminder'))
    OR
    -- Day 5: Pricing tips (if has items)
    (ud.days_since_signup >= 5 AND ud.days_since_signup < 6
     AND ud.has_items
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day5_tips'))
    OR
    -- Day 7: Portfolio insights (if has 5+ items)
    (ud.days_since_signup >= 7 AND ud.days_since_signup < 8
     AND ud.item_count >= 5
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day7_insights'))
    OR
    -- Day 10: Sharing feature (if has items)
    (ud.days_since_signup >= 10 AND ud.days_since_signup < 11
     AND ud.has_items
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day10_sharing'))
    OR
    -- Day 14: Advanced features (if has items)
    (ud.days_since_signup >= 14 AND ud.days_since_signup < 15
     AND ud.has_items
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day14_advanced'));
END;
$$;