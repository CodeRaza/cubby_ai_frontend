-- Fix function search path security warning
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;