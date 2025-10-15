-- Fix security definer view issue by dropping and recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.ebay_api_daily_stats;

CREATE VIEW public.ebay_api_daily_stats 
WITH (security_invoker = true)
AS
SELECT 
  date_trunc('day', created_at) as date,
  endpoint,
  operation,
  status,
  COUNT(*) as call_count,
  AVG(response_time_ms) as avg_response_time,
  MIN(response_time_ms) as min_response_time,
  MAX(response_time_ms) as max_response_time,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count
FROM public.ebay_api_usage
GROUP BY date_trunc('day', created_at), endpoint, operation, status
ORDER BY date DESC;

-- Grant appropriate permissions
GRANT SELECT ON public.ebay_api_daily_stats TO authenticated;

-- Create RLS policy for the view (inherits from the table policies)
CREATE POLICY "Admins can view daily stats" 
ON public.ebay_api_usage 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));