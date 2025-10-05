-- Drop the view since it can't have RLS  
DROP VIEW IF EXISTS public.locations_safe;

-- Drop and recreate the shared users policy to ensure it exists correctly
DROP POLICY IF EXISTS "Shared users can view locations" ON public.locations;

CREATE POLICY "Shared users can view locations"
ON public.locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_access
    WHERE shared_access.location_id = locations.id
    AND shared_access.user_id = auth.uid()
  )
);