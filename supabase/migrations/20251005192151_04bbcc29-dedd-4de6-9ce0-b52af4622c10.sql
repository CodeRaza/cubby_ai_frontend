-- Fix the security definer view issue by dropping and recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.locations_safe;

-- Create view without SECURITY DEFINER (uses invoker's permissions)
CREATE VIEW public.locations_safe AS
SELECT 
  l.id,
  l.name,
  l.user_id,
  l.gps_lat,
  l.gps_lng,
  l.created_at,
  CASE 
    WHEN auth.uid() = l.user_id THEN l.share_token
    ELSE NULL
  END as share_token
FROM public.locations l;

-- Grant appropriate access to the view
GRANT SELECT ON public.locations_safe TO authenticated;