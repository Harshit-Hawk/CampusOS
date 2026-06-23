-- Add missing SELECT policies for public storage buckets
DO $$
DECLARE
    pub_buckets text[] := ARRAY['avatars', 'posts', 'clubs', 'events', 'submissions', 'banners', 'feed_media', 'event_banners', 'academic-resources', 'announcement-attachments', 'club-assets', 'certificates', 'marketplace', 'community_files'];
    b text;
BEGIN
    FOREACH b IN ARRAY pub_buckets
    LOOP
        -- Recreate public read access for each bucket
        EXECUTE format('
            DROP POLICY IF EXISTS "Public can view %s" ON storage.objects;
            CREATE POLICY "Public can view %s" 
            ON storage.objects FOR SELECT 
            USING (bucket_id = %L);
        ', b, b, b);
    END LOOP;
END $$;
