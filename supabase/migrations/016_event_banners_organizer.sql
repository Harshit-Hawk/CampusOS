-- Migration to add organizer_name and banner_url to events table
-- and set up the event_banners storage bucket.

ALTER TABLE events ADD COLUMN organizer_name TEXT;
ALTER TABLE events ADD COLUMN banner_url TEXT;

-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event_banners', 'event_banners', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to event_banners
CREATE POLICY "Public Access event_banners" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event_banners');

-- Allow authenticated users to upload event banners
CREATE POLICY "Auth Upload event_banners" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'event_banners' AND auth.role() = 'authenticated');
