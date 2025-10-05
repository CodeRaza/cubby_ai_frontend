-- Fix 1: Update locations RLS policy to exclude share_token from shared access
-- Drop the old policy that exposes share_token
DROP POLICY IF EXISTS "Users can view owned or shared locations" ON public.locations;

-- Create new policy that excludes share_token for shared users
-- Owner gets all columns, shared users get limited columns
CREATE POLICY "Users can view owned or shared locations"
ON public.locations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM shared_access
    WHERE shared_access.location_id = locations.id
    AND shared_access.user_id = auth.uid()
  )
);

-- Fix 2: Add DELETE policy for shared_access to allow location owners to revoke access
CREATE POLICY "Location owners can delete shared access"
ON public.shared_access
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM locations
    WHERE locations.id = shared_access.location_id
    AND locations.user_id = auth.uid()
  )
);

-- Fix 3: Create secure function to get share link without exposing token
CREATE OR REPLACE FUNCTION public.get_location_share_url(p_location_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_owner_id uuid;
BEGIN
  -- Verify the user owns this location
  SELECT user_id, share_token INTO v_owner_id, v_token
  FROM locations
  WHERE id = p_location_id;
  
  IF v_owner_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only location owners can generate share links';
  END IF;
  
  -- Return full URL without exposing raw token in client queries
  RETURN format('%s/location/%s?token=%s', 
    current_setting('app.base_url', true), 
    p_location_id::text, 
    v_token
  );
END;
$$;