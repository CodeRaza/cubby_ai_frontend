-- Create card_details table for sports card specific information
CREATE TABLE public.card_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT,
  card_year INTEGER,
  set_brand TEXT,
  sport TEXT,
  card_number TEXT,
  condition TEXT,
  is_graded BOOLEAN DEFAULT FALSE,
  grading_company TEXT,
  grade NUMERIC(3,1),
  estimated_value NUMERIC(10,2),
  special_attributes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id)
);

-- Enable RLS
ALTER TABLE public.card_details ENABLE ROW LEVEL SECURITY;

-- Users can view card details for items they own
CREATE POLICY "Users can view card details for their items"
ON public.card_details
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = card_details.item_id
    AND items.user_id = auth.uid()
  )
);

-- Users can insert card details for their items
CREATE POLICY "Users can insert card details for their items"
ON public.card_details
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = card_details.item_id
    AND items.user_id = auth.uid()
  )
);

-- Users can update card details for their items
CREATE POLICY "Users can update card details for their items"
ON public.card_details
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = card_details.item_id
    AND items.user_id = auth.uid()
  )
);

-- Users can delete card details for their items
CREATE POLICY "Users can delete card details for their items"
ON public.card_details
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = card_details.item_id
    AND items.user_id = auth.uid()
  )
);

-- Add source_context column to items table to track user source
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS source_context TEXT;

-- Create trigger for updating card_details updated_at
CREATE OR REPLACE FUNCTION public.update_card_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_card_details_updated_at
BEFORE UPDATE ON public.card_details
FOR EACH ROW
EXECUTE FUNCTION public.update_card_details_updated_at();