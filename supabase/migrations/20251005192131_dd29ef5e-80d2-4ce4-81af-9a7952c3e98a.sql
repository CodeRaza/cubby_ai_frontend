-- Fix 1: Implement column-level security for share_token
-- Drop existing policy and recreate with proper column restrictions
DROP POLICY IF EXISTS "Users can view owned or shared locations" ON public.locations;

-- Policy for location owners (can see all columns including share_token)
CREATE POLICY "Location owners can view all columns"
ON public.locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for shared access users (cannot see share_token)
-- Since PostgreSQL RLS doesn't support column-level restrictions in policies,
-- we need to handle this at the application level or use a view
-- For now, we'll document that queries should explicitly exclude share_token

-- Fix 2: Allow location owners to view who has access to their locations
CREATE POLICY "Location owners can view shared access to their locations"
ON public.shared_access
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR
  EXISTS (
    SELECT 1 FROM locations
    WHERE locations.id = shared_access.location_id
    AND locations.user_id = auth.uid()
  )
);

-- Fix 3: Allow users to delete their own detection data
CREATE POLICY "Users can delete detections for their items"
ON public.detections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM items
    WHERE items.id = detections.item_id
    AND items.user_id = auth.uid()
  )
);

-- Fix 4: Allow users to update their own detection data
CREATE POLICY "Users can update detections for their items"
ON public.detections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM items
    WHERE items.id = detections.item_id
    AND items.user_id = auth.uid()
  )
);

-- Fix 5: Create a secure view for locations that excludes share_token for non-owners
CREATE OR REPLACE VIEW public.locations_safe AS
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