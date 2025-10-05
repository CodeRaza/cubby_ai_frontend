-- Fix search path for calculate_next_reminder_date function
DROP FUNCTION IF EXISTS calculate_next_reminder_date(TIMESTAMP WITH TIME ZONE, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION calculate_next_reminder_date(
  p_last_date TIMESTAMP WITH TIME ZONE,
  p_interval_value INTEGER,
  p_interval_unit TEXT
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_last_date IS NULL THEN
    p_last_date := NOW();
  END IF;

  RETURN CASE p_interval_unit
    WHEN 'days' THEN p_last_date + (p_interval_value || ' days')::INTERVAL
    WHEN 'weeks' THEN p_last_date + (p_interval_value || ' weeks')::INTERVAL
    WHEN 'months' THEN p_last_date + (p_interval_value || ' months')::INTERVAL
    WHEN 'quarters' THEN p_last_date + (p_interval_value * 3 || ' months')::INTERVAL
    ELSE p_last_date
  END;
END;
$$;