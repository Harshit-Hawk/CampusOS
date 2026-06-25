-- Fix certificate storage RLS to allow event organizers to upload certificates for participants
CREATE POLICY "Event organizers can upload certificates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Event organizers can update certificates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificates');
