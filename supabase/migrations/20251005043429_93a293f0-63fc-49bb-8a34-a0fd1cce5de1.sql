-- Add share_token to locations table
ALTER TABLE public.locations 
ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Create index for faster token lookups
CREATE INDEX idx_locations_share_token ON public.locations(share_token);

-- Create shared_access table to track who has access to which locations
CREATE TABLE public.shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, location_id)
);

-- Enable RLS on shared_access
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared access records
CREATE POLICY "Users can view their own shared access"
  ON public.shared_access FOR SELECT
  USING (auth.uid() = user_id);

-- Users can't directly insert shared access (done via token validation)
-- Only system/owner can insert
CREATE POLICY "System can insert shared access"
  ON public.shared_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update locations RLS to allow viewing shared locations
DROP POLICY IF EXISTS "Users can view their own locations" ON public.locations;
CREATE POLICY "Users can view owned or shared locations"
  ON public.locations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.shared_access
      WHERE shared_access.location_id = locations.id
      AND shared_access.user_id = auth.uid()
    )
  );

-- Update items RLS to allow viewing items in shared locations
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
CREATE POLICY "Users can view owned or shared items"
  ON public.items FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.shared_access
      WHERE shared_access.location_id = items.location_id
      AND shared_access.user_id = auth.uid()
    )
  );

-- Create function to grant shared access via token
CREATE OR REPLACE FUNCTION public.grant_shared_access(
  p_location_id UUID,
  p_share_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Check if token is valid for this location
  SELECT EXISTS (
    SELECT 1 FROM public.locations
    WHERE id = p_location_id
    AND share_token = p_share_token
  ) INTO v_valid;

  IF NOT v_valid THEN
    RETURN FALSE;
  END IF;

  -- Grant access (ignore if already exists)
  INSERT INTO public.shared_access (user_id, location_id)
  VALUES (auth.uid(), p_location_id)
  ON CONFLICT (user_id, location_id) DO NOTHING;

  RETURN TRUE;
END;
$$;