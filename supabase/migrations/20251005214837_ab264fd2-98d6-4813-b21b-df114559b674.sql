-- Drop the policy that still allows shared users to see all columns
DROP POLICY IF EXISTS "Shared users can view basic location info" ON public.locations;

-- Create a view that excludes share_token for shared users
CREATE OR REPLACE VIEW public.v_locations_shared AS
SELECT 
  l.id,
  l.name,
  l.user_id,
  l.gps_lat,
  l.gps_lng,
  l.created_at,
  (l.user_id = auth.uid()) as is_owner
FROM public.locations l
WHERE user_has_location_access(auth.uid(), l.id);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.v_locations_shared TO authenticated;

-- Add RLS to the view
ALTER VIEW public.v_locations_shared SET (security_barrier = true);

-- Now only owners can SELECT directly from the locations table (which includes share_token)
-- Shared users must use v_locations_shared or get_location_info function