-- Create enum for subscription plans
CREATE TYPE public.subscription_tier AS ENUM ('free', 'starter', 'pro', 'power');

-- Create subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create scan usage tracking table
CREATE TABLE public.scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scans_used INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for scan_usage
CREATE POLICY "Users can view their own usage"
  ON public.scan_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.scan_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.scan_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get scan limits for each tier
CREATE OR REPLACE FUNCTION public.get_scan_limit(tier subscription_tier)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 250
    WHEN 'power' THEN 1000
  END;
END;
$$;

-- Function to check if user can scan
CREATE OR REPLACE FUNCTION public.can_user_scan(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_usage scan_usage%ROWTYPE;
  v_limit INTEGER;
  v_total_available INTEGER;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription, create free tier
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, plan_tier, status, current_period_start, current_period_end)
    VALUES (
      p_user_id,
      'free',
      'active',
      date_trunc('month', now()),
      date_trunc('month', now() + interval '1 month')
    )
    RETURNING * INTO v_subscription;
  END IF;
  
  -- Get current period usage
  SELECT * INTO v_usage
  FROM scan_usage
  WHERE user_id = p_user_id
    AND period_start = date_trunc('month', now());
  
  -- If no usage record, create one
  IF NOT FOUND THEN
    INSERT INTO scan_usage (user_id, scans_used, bonus_credits, period_start, period_end)
    VALUES (
      p_user_id,
      0,
      0,
      date_trunc('month', now()),
      date_trunc('month', now() + interval '1 month')
    )
    RETURNING * INTO v_usage;
  END IF;
  
  -- Get limit for user's tier
  v_limit := get_scan_limit(v_subscription.plan_tier);
  v_total_available := v_limit + v_usage.bonus_credits;
  
  -- Check if user has scans remaining
  RETURN v_usage.scans_used < v_total_available;
END;
$$;

-- Function to increment scan usage
CREATE OR REPLACE FUNCTION public.increment_scan_usage(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_scan BOOLEAN;
BEGIN
  -- Check if user can scan
  v_can_scan := can_user_scan(p_user_id);
  
  IF NOT v_can_scan THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage
  UPDATE scan_usage
  SET scans_used = scans_used + 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND period_start = date_trunc('month', now());
  
  RETURN TRUE;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scan_usage_updated_at
  BEFORE UPDATE ON public.scan_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();