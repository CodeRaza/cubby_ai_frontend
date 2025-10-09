-- Fix the get_users_needing_reminders function to handle email type correctly
DROP FUNCTION IF EXISTS get_users_needing_reminders();

CREATE OR REPLACE FUNCTION public.get_users_needing_reminders()
 RETURNS TABLE(user_id uuid, email text, days_since_signup integer, has_location boolean, has_items boolean, last_email_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      u.id,
      u.email::text as email,  -- Cast to text
      EXTRACT(DAY FROM (NOW() - u.created_at))::INTEGER as days_since_signup,
      EXISTS(SELECT 1 FROM locations l WHERE l.user_id = u.id) as has_location,
      EXISTS(SELECT 1 FROM items i WHERE i.user_id = u.id) as has_items,
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
    ud.last_email_type
  FROM user_data ud
  WHERE 
    -- Day 1 reminder: 1 day old, no location yet, haven't sent day1 reminder
    (ud.days_since_signup >= 1 
     AND ud.days_since_signup < 2 
     AND NOT ud.has_location 
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day1_reminder'))
    OR
    -- Day 3 reminder: 3 days old, no items yet, haven't sent day3 reminder
    (ud.days_since_signup >= 3 
     AND ud.days_since_signup < 4 
     AND NOT ud.has_items 
     AND (ud.last_email_type IS NULL OR ud.last_email_type != 'day3_reminder'));
END;
$function$;