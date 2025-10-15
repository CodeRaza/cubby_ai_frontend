-- Create eBay API usage tracking table
CREATE TABLE public.ebay_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  operation text NOT NULL,
  status text NOT NULL,
  response_time_ms integer,
  error_message text,
  user_id uuid,
  card_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ebay_api_usage ENABLE ROW LEVEL SECURITY;

-- Admin can view all usage
CREATE POLICY "Admins can view all eBay API usage" 
ON public.ebay_api_usage 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- System can insert usage logs
CREATE POLICY "System can insert API usage" 
ON public.ebay_api_usage 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_ebay_api_usage_created_at ON public.ebay_api_usage(created_at DESC);
CREATE INDEX idx_ebay_api_usage_endpoint ON public.ebay_api_usage(endpoint);
CREATE INDEX idx_ebay_api_usage_status ON public.ebay_api_usage(status);

-- Create view for daily usage stats
CREATE OR REPLACE VIEW public.ebay_api_daily_stats AS
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

-- Admin can view stats
ALTER VIEW public.ebay_api_daily_stats OWNER TO postgres;
GRANT SELECT ON public.ebay_api_daily_stats TO authenticated;