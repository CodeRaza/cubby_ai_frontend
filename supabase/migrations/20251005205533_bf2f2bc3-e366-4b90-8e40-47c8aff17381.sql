-- Drop the overly permissive shared user policy
DROP POLICY IF EXISTS "Shared users can view locations" ON public.locations;

-- Create a more restrictive policy for shared users that explicitly excludes owners
-- This works with the owner policy to ensure proper separation
CREATE POLICY "Shared users can view basic location info"
ON public.locations
FOR SELECT
USING (
  -- User has shared access AND is not the owner
  user_has_location_access(auth.uid(), id) 
  AND auth.uid() != user_id
);

-- Create a secure function to get location details for shared users
-- This function never exposes share_token to non-owners
CREATE OR REPLACE FUNCTION public.get_location_info(p_location_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  user_id uuid,
  gps_lat numeric,
  gps_lng numeric,
  created_at timestamp with time zone,
  is_owner boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has access to this location
  IF NOT user_has_location_access(auth.uid(), p_location_id) THEN
    RAISE EXCEPTION 'Access denied to location';
  END IF;

  -- Return location data (share_token is deliberately excluded)
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.user_id,
    l.gps_lat,
    l.gps_lng,
    l.created_at,
    (l.user_id = auth.uid()) as is_owner
  FROM public.locations l
  WHERE l.id = p_location_id;
END;
$$;

-- Update get_location_share_url to be even more secure
-- Ensure it returns NULL if called by non-owner (defense in depth)
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
  FROM public.locations
  WHERE id = p_location_id;
  
  -- Return NULL if location doesn't exist
  IF v_owner_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return NULL if not the owner (security improvement)
  IF v_owner_id != auth.uid() THEN
    RETURN NULL;
  END IF;
  
  -- Only owners get the share URL
  RETURN format('%s/location/%s?token=%s', 
    current_setting('app.base_url', true), 
    p_location_id::text, 
    v_token
  );
END;
$$;