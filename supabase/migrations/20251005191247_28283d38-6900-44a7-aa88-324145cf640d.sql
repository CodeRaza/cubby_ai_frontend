-- Drop the insecure admin_analytics view that exposes auth.users
-- The frontend already uses the secure get_admin_analytics() RPC function
-- which has proper security definer protection and admin role checks
DROP VIEW IF EXISTS public.admin_analytics CASCADE;