-- Create locations table
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  gps_lat decimal(10, 8),
  gps_lng decimal(11, 8),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create items table
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text,
  quantity integer DEFAULT 1,
  expiry_date date,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create detections table
CREATE TABLE public.detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  confidence decimal(5, 4),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations
CREATE POLICY "Users can view their own locations"
  ON public.locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations"
  ON public.locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
  ON public.locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
  ON public.locations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for items
CREATE POLICY "Users can view their own items"
  ON public.items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for detections
CREATE POLICY "Users can view detections for their items"
  ON public.detections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = detections.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create detections for their items"
  ON public.detections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = detections.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true);

-- Storage policies
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view item images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'item-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'item-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
CREATE INDEX idx_locations_user_id ON public.locations(user_id);
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_items_location_id ON public.items(location_id);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_detections_item_id ON public.detections(item_id);