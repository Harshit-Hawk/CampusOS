-- Create event_banners table
CREATE TABLE IF NOT EXISTS event_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    date_text TEXT,
    time_text TEXT,
    location TEXT,
    image_url TEXT NOT NULL,
    going_count INTEGER DEFAULT 0,
    target_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_banners ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view active banners
CREATE POLICY "Public read access to event_banners"
ON event_banners FOR SELECT
USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to event_banners"
ON event_banners FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Create a storage bucket for event banner images if needed (optional)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access to banners bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload to banners bucket"
ON storage.objects FOR INSERT
USING (
    bucket_id = 'banners' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'banners' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update banners bucket"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'banners' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete from banners bucket"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'banners' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
