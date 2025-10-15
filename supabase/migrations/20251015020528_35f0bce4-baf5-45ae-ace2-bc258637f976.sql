-- Drop the trigger and function using CASCADE to handle dependencies
DROP FUNCTION IF EXISTS update_next_reminder_date() CASCADE;