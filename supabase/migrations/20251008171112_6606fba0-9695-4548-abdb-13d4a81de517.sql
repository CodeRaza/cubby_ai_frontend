-- Create email tracking table to log all sent emails
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'welcome', 'day1_reminder', 'day3_reminder'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own email tracking
CREATE POLICY "Users can view their own email tracking"
ON public.email_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert email tracking (edge function will use service role)
CREATE POLICY "System can insert email tracking"
ON public.email_tracking
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_email_tracking_user_id ON public.email_tracking(user_id);
CREATE INDEX idx_email_tracking_email_type ON public.email_tracking(email_type);
CREATE INDEX idx_email_tracking_sent_at ON public.email_tracking(sent_at);

-- Function to get users needing day 1 or day 3 reminders
CREATE OR REPLACE FUNCTION public.get_users_needing_reminders()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  days_since_signup INTEGER,
  has_location BOOLEAN,
  has_items BOOLEAN,
  last_email_type TEXT
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
      u.email,
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
$$;