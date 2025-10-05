-- Add reminder fields to items table
ALTER TABLE items
ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_interval_value INTEGER,
ADD COLUMN reminder_interval_unit TEXT CHECK (reminder_interval_unit IN ('days', 'weeks', 'months', 'quarters')),
ADD COLUMN last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN next_reminder_date TIMESTAMP WITH TIME ZONE;

-- Create index for efficient reminder queries
CREATE INDEX idx_items_next_reminder ON items(next_reminder_date) WHERE reminder_enabled = TRUE;

-- Create function to calculate next reminder date
CREATE OR REPLACE FUNCTION calculate_next_reminder_date(
  p_last_date TIMESTAMP WITH TIME ZONE,
  p_interval_value INTEGER,
  p_interval_unit TEXT
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
IMMUTABLE
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

-- Create function to update next reminder date when reminder settings change
CREATE OR REPLACE FUNCTION update_next_reminder_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reminder_enabled = TRUE AND 
     NEW.reminder_interval_value IS NOT NULL AND 
     NEW.reminder_interval_unit IS NOT NULL THEN
    
    -- If this is a new reminder or the interval changed, calculate from now
    IF OLD.reminder_enabled IS NULL OR 
       OLD.reminder_enabled = FALSE OR
       OLD.reminder_interval_value IS DISTINCT FROM NEW.reminder_interval_value OR
       OLD.reminder_interval_unit IS DISTINCT FROM NEW.reminder_interval_unit THEN
      
      NEW.next_reminder_date := calculate_next_reminder_date(
        NOW(),
        NEW.reminder_interval_value,
        NEW.reminder_interval_unit
      );
      NEW.last_reminder_sent := NULL;
    END IF;
  ELSE
    -- If reminder is disabled, clear reminder dates
    NEW.next_reminder_date := NULL;
    NEW.last_reminder_sent := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update next_reminder_date
CREATE TRIGGER set_next_reminder_date
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_next_reminder_date();