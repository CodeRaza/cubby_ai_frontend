-- Drop the problematic policies
DROP POLICY IF EXISTS "Shared users can view locations" ON public.locations;
DROP POLICY IF EXISTS "Location owners can view shared access to their locations" ON public.shared_access;

-- Create a security definer function to check location access
CREATE OR REPLACE FUNCTION public.user_has_location_access(_user_id uuid, _location_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user owns the location OR has shared access
  SELECT EXISTS (
    SELECT 1 FROM public.locations
    WHERE id = _location_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.shared_access
    WHERE location_id = _location_id AND user_id = _user_id
  )
$$;

-- Recreate the shared access policy using the function
CREATE POLICY "Shared users can view locations"
ON public.locations
FOR SELECT
USING (public.user_has_location_access(auth.uid(), id));

-- Recreate the location owners policy for shared_access
CREATE POLICY "Location owners can view shared access to their locations"
ON public.shared_access
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.locations
    WHERE id = shared_access.location_id AND user_id = auth.uid()
  )
);