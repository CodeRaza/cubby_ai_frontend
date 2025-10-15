-- Create email_settings table to control email sending
CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emails_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Insert initial row with emails paused
INSERT INTO public.email_settings (emails_enabled, notes)
VALUES (false, 'Emails paused by user request')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and update email settings
CREATE POLICY "Admins can view email settings"
ON public.email_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email settings"
ON public.email_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update timestamp
CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();