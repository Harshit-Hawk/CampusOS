-- Migration: Add attachments to club announcements
ALTER TABLE public.club_announcements
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Storage Bucket for Announcements
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcement-attachments', 'announcement-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access for Announcement Attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'announcement-attachments' );

CREATE POLICY "Club Leaders Can Upload Announcement Attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'announcement-attachments' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Club Leaders Can Delete Announcement Attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'announcement-attachments' AND
    auth.role() = 'authenticated'
);

-- RLS Policy for Deleting Announcements
CREATE POLICY "Club leaders can delete announcements"
    ON public.club_announcements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_announcements.club_id
            AND user_id = auth.uid()
            AND role IN ('leader', 'president', 'vice_president', 'secretary')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
