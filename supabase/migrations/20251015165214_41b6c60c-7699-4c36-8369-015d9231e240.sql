-- Schedule the top cards refresh to run daily at 2 AM
SELECT cron.schedule(
  'refresh-top-cards-daily',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/refresh-top-cards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocWR4bHFhcW1jcW53dGxvdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODg3NjUsImV4cCI6MjA3NTE2NDc2NX0.gH_9GdTuadMvQAF5t8LCSCg3VBCffrqUviUET3C_T6k"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);