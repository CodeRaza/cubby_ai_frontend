-- Create shared card pricing cache table (all users share the same pricing data)
CREATE TABLE public.card_pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key TEXT UNIQUE NOT NULL, -- composite key like "1987-Fleer-Barry Bonds-604-Baseball"
  player_name TEXT,
  card_year INTEGER,
  brand TEXT,
  card_number TEXT,
  sport TEXT,
  set_name TEXT,
  condition TEXT DEFAULT 'raw',
  is_graded BOOLEAN DEFAULT false,
  estimated_value NUMERIC,
  average_sale_price NUMERIC,
  sale_count INTEGER DEFAULT 0,
  last_ebay_fetch TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing queue for background processing
CREATE TABLE public.pricing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_details_id UUID NOT NULL REFERENCES card_details(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  card_key TEXT NOT NULL,
  priority INTEGER DEFAULT 50, -- higher = more urgent (based on card value)
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_pending_job UNIQUE(card_details_id, status)
);

-- Enable RLS
ALTER TABLE public.card_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_queue ENABLE ROW LEVEL SECURITY;

-- Cache is publicly readable (shared pricing data for all users)
CREATE POLICY "Anyone can view pricing cache"
ON public.card_pricing_cache FOR SELECT
USING (true);

-- System can manage cache
CREATE POLICY "System can insert cache"
ON public.card_pricing_cache FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update cache"
ON public.card_pricing_cache FOR UPDATE
USING (true);

-- Users can view their own queue items
CREATE POLICY "Users can view their queue"
ON public.pricing_queue FOR SELECT
USING (auth.uid() = user_id);

-- Users can queue pricing jobs
CREATE POLICY "Users can queue pricing jobs"
ON public.pricing_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System can update queue
CREATE POLICY "System can update queue"
ON public.pricing_queue FOR UPDATE
USING (true);

CREATE POLICY "System can delete queue"
ON public.pricing_queue FOR DELETE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_pricing_cache_key ON card_pricing_cache(card_key);
CREATE INDEX idx_pricing_cache_last_fetch ON card_pricing_cache(last_ebay_fetch);
CREATE INDEX idx_pricing_queue_status ON pricing_queue(status, priority DESC, created_at);
CREATE INDEX idx_pricing_queue_card ON pricing_queue(card_details_id);

-- Function to generate standardized card key
CREATE OR REPLACE FUNCTION generate_card_key(
  p_year INTEGER,
  p_brand TEXT,
  p_player TEXT,
  p_number TEXT,
  p_sport TEXT
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(CONCAT_WS('-',
    COALESCE(p_year::text, 'unknown'),
    COALESCE(TRIM(p_brand), 'unknown'),
    COALESCE(TRIM(p_player), 'unknown'),
    COALESCE(REPLACE(TRIM(p_number), '#', ''), 'unknown'),
    COALESCE(TRIM(p_sport), 'unknown')
  ));
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_pricing_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pricing_cache_timestamp
BEFORE UPDATE ON card_pricing_cache
FOR EACH ROW
EXECUTE FUNCTION update_pricing_cache_updated_at();