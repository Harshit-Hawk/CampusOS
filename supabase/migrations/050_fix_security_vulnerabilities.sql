-- 050_fix_security_vulnerabilities.sql

-- 1. Enable RLS on student_batches
ALTER TABLE public.student_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view student batches" ON public.student_batches FOR SELECT USING (true);

-- 2. Fix Permissive RLS Policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert receipts" ON public.broadcast_receipts;
DROP POLICY IF EXISTS "System can insert skills" ON public.certificate_skills;
DROP POLICY IF EXISTS "System can update reports" ON public.event_reports;

-- hashtags
DROP POLICY IF EXISTS "Auth can create hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Auth can update hashtags" ON public.hashtags;
CREATE POLICY "Auth can create hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- notifications
DROP POLICY IF EXISTS "Auth users can insert notifications" ON public.notifications;

-- post_hashtags
DROP POLICY IF EXISTS "Auth can create post hashtags" ON public.post_hashtags;
CREATE POLICY "Auth can create post hashtags" ON public.post_hashtags FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);


-- 3. Revoke EXECUTE from PUBLIC on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_post_like_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_post_comment_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_club_member_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_event_registered_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_cc(uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_volunteer_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp_on_certificate_verified() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.convert_to_alumni(uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_xp(uuid, integer, text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp_on_club_join() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp_on_event_register() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_community() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_community_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_event_community() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_event_registration_community() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_club_community() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_club_member_community() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_broadcast(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_admin(uuid) TO authenticated;


-- 4. Secure Public Storage Buckets
-- Removing broad SELECT policies to prevent bucket listing, while preserving public URL access.
DROP POLICY IF EXISTS "Anyone can view academic resources" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Announcement Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to banners bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Certificate files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Club images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view community files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access event_banners" ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view feed media" ON storage.objects;
DROP POLICY IF EXISTS "Marketplace images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
