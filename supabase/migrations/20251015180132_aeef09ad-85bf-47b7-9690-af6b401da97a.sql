-- Create support_requests table for feature requests and support inquiries
CREATE TABLE public.support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'support')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own support requests" 
ON public.support_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support requests" 
ON public.support_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_support_requests_user_id ON public.support_requests(user_id);
CREATE INDEX idx_support_requests_status ON public.support_requests(status);