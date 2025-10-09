-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the reminder email function to run once per day at 10 AM UTC
SELECT cron.schedule(
  'send-daily-reminder-emails',
  '0 10 * * *', -- Every day at 10:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/send-reminder-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocWR4bHFhcW1jcW53dGxvdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODg3NjUsImV4cCI6MjA3NTE2NDc2NX0.gH_9GdTuadMvQAF5t8LCSCg3VBCffrqUviUET3C_T6k"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);