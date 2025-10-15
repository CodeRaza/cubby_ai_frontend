-- Add price history tracking table
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.card_details(id) ON DELETE CASCADE,
  price NUMERIC(10,2),
  source TEXT NOT NULL, -- 'ebay', 'cardladder', 'marketmovers'
  condition TEXT, -- 'raw', 'psa_9', 'psa_10', etc
  date_of_sale TIMESTAMPTZ,
  sale_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add price alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.card_details(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'price_increase', 'price_decrease', 'threshold'
  threshold_percentage NUMERIC(5,2), -- e.g., 5.0 for 5%
  threshold_amount NUMERIC(10,2), -- absolute dollar amount
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_card_id ON public.price_history(card_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON public.price_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_card_id ON public.price_alerts(card_id);

-- Update card_details to include pricing metadata
ALTER TABLE public.card_details 
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_trend_7d NUMERIC(5,2), -- percentage change over 7 days
ADD COLUMN IF NOT EXISTS price_trend_30d NUMERIC(5,2), -- percentage change over 30 days
ADD COLUMN IF NOT EXISTS last_sale_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sale_price NUMERIC(10,2);

-- Enable RLS on new tables
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for price_history
CREATE POLICY "Users can view price history for their cards"
ON public.price_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.card_details cd
    JOIN public.items i ON i.id = cd.item_id
    WHERE cd.id = price_history.card_id
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert price history"
ON public.price_history FOR INSERT
WITH CHECK (true);

-- RLS policies for price_alerts
CREATE POLICY "Users can manage their own alerts"
ON public.price_alerts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to calculate price trends
CREATE OR REPLACE FUNCTION public.update_card_price_trends()
RETURNS TRIGGER AS $$
DECLARE
  v_price_7d_ago NUMERIC;
  v_price_30d_ago NUMERIC;
  v_current_price NUMERIC;
BEGIN
  -- Get current estimated value
  SELECT estimated_value INTO v_current_price
  FROM public.card_details
  WHERE id = NEW.card_id;

  -- Get price from 7 days ago
  SELECT price INTO v_price_7d_ago
  FROM public.price_history
  WHERE card_id = NEW.card_id
    AND created_at <= NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get price from 30 days ago
  SELECT price INTO v_price_30d_ago
  FROM public.price_history
  WHERE card_id = NEW.card_id
    AND created_at <= NOW() - INTERVAL '30 days'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Update trends if we have historical data
  IF v_price_7d_ago IS NOT NULL AND v_price_7d_ago > 0 THEN
    UPDATE public.card_details
    SET price_trend_7d = ((v_current_price - v_price_7d_ago) / v_price_7d_ago) * 100
    WHERE id = NEW.card_id;
  END IF;

  IF v_price_30d_ago IS NOT NULL AND v_price_30d_ago > 0 THEN
    UPDATE public.card_details
    SET price_trend_30d = ((v_current_price - v_price_30d_ago) / v_price_30d_ago) * 100
    WHERE id = NEW.card_id;
  END IF;

  -- Update last price info
  UPDATE public.card_details
  SET 
    last_price_update = NOW(),
    last_sale_date = NEW.date_of_sale,
    last_sale_price = NEW.price
  WHERE id = NEW.card_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update trends when new price history is added
CREATE TRIGGER update_price_trends_trigger
AFTER INSERT ON public.price_history
FOR EACH ROW
EXECUTE FUNCTION public.update_card_price_trends();