-- Add acquired_date and cost columns to items table
ALTER TABLE items
ADD COLUMN acquired_date DATE,
ADD COLUMN cost NUMERIC(10, 2);

-- Remove reminder-related columns from items table
ALTER TABLE items
DROP COLUMN IF EXISTS reminder_enabled,
DROP COLUMN IF EXISTS reminder_interval_value,
DROP COLUMN IF EXISTS reminder_interval_unit,
DROP COLUMN IF EXISTS last_reminder_sent,
DROP COLUMN IF EXISTS next_reminder_date;