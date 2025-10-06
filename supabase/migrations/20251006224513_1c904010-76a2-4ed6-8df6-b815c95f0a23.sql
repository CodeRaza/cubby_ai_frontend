-- Drop and recreate v_locations_shared without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_locations_shared;

CREATE VIEW public.v_locations_shared AS
SELECT 
  l.id,
  l.name,
  l.user_id,
  l.gps_lat,
  l.gps_lng,
  l.created_at,
  (l.user_id = auth.uid()) as is_owner
FROM public.locations l
WHERE l.user_id = auth.uid()
   OR EXISTS (
     SELECT 1 FROM public.shared_access sa
     WHERE sa.location_id = l.id AND sa.user_id = auth.uid()
   );