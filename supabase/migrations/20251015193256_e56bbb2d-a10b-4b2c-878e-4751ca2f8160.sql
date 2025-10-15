-- Update process-pricing-queue cron job to run once daily at 3 AM instead of every 5 minutes
SELECT cron.unschedule('process-pricing-queue-job');

SELECT cron.schedule(
  'process-pricing-queue-job',
  '0 3 * * *', -- Daily at 3 AM
  $$
  SELECT
    net.http_post(
        url:='https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/process-pricing-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocWR4bHFhcW1jcW53dGxvdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODg3NjUsImV4cCI6MjA3NTE2NDc2NX0.gH_9GdTuadMvQAF5t8LCSCg3VBCffrqUviUET3C_T6k"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);