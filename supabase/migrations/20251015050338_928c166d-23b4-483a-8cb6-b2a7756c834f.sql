-- Add sold tracking fields to items table
ALTER TABLE public.items
ADD COLUMN sold boolean DEFAULT false,
ADD COLUMN sold_price numeric,
ADD COLUMN sold_date date;

-- Add index for sold items queries
CREATE INDEX idx_items_sold ON public.items(sold, user_id);

COMMENT ON COLUMN public.items.sold IS 'Whether the item has been sold';
COMMENT ON COLUMN public.items.sold_price IS 'Price the item was sold for';
COMMENT ON COLUMN public.items.sold_date IS 'Date the item was sold';