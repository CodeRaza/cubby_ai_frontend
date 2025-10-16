-- Create a daily cron job that runs at 10:00 AM UTC
SELECT cron.schedule(
  'process-pricing-queue-daily-10am',
  '0 10 * * *', -- Every day at 10:00 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/process-pricing-queue',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocWR4bHFhcW1jcW53dGxvdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODg3NjUsImV4cCI6MjA3NTE2NDc2NX0.gH_9GdTuadMvQAF5t8LCSCg3VBCffrqUviUET3C_T6k"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);