-- Drop unused v_locations_shared view
-- This view is not referenced in the codebase and poses a security risk
DROP VIEW IF EXISTS public.v_locations_shared;