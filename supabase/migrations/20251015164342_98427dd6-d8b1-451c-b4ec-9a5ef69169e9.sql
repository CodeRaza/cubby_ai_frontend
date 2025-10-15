-- Schedule the pricing queue processor to run every 5 minutes
SELECT cron.schedule(
  'process-pricing-queue-job',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/process-pricing-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocWR4bHFhcW1jcW53dGxvdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODg3NjUsImV4cCI6MjA3NTE2NDc2NX0.gH_9GdTuadMvQAF5t8LCSCg3VBCffrqUviUET3C_T6k"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);