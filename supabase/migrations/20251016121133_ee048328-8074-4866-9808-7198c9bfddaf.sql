-- Create cache refresh tracker table
CREATE TABLE IF NOT EXISTS public.cache_refresh_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_batch_start integer NOT NULL DEFAULT 0,
  last_run_at timestamp with time zone NOT NULL DEFAULT now(),
  total_cards_refreshed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert initial record
INSERT INTO public.cache_refresh_tracker (last_batch_start, total_cards_refreshed)
VALUES (0, 0)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.cache_refresh_tracker ENABLE ROW LEVEL SECURITY;

-- Allow system to manage tracker
CREATE POLICY "System can manage tracker" ON public.cache_refresh_tracker
  FOR ALL USING (true) WITH CHECK (true);