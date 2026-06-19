-- Migration 036: Universal Certificate Repository
-- Students upload external certs, admin verifies, AI extracts skills

-- 1. External Certificates
CREATE TABLE IF NOT EXISTS public.certificates_external (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL, -- e.g., 'Google', 'Coursera', 'AWS'
    platform TEXT NOT NULL CHECK (platform IN (
        'ibm', 'google', 'microsoft', 'cisco', 'aws', 'coursera', 'udemy',
        'nptel', 'hackathon', 'workshop', 'internship', 'other'
    )),
    credential_url TEXT,
    credential_id TEXT,
    certificate_file_url TEXT, -- uploaded file
    issue_date DATE,
    expiry_date DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'verified', 'rejected'
    )),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. AI-Extracted Skills from Certificates
CREATE TABLE IF NOT EXISTS public.certificate_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID REFERENCES public.certificates_external(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_name TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'beginner' CHECK (proficiency_level IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    extracted_by TEXT DEFAULT 'ai' CHECK (extracted_by IN ('ai', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(certificate_id, skill_name)
);

-- Storage bucket for certificate files
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Certificate files are publicly accessible"
    ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Authenticated users can upload certificates"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own certificate files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Indexes
CREATE INDEX idx_certs_ext_user ON public.certificates_external(user_id);
CREATE INDEX idx_certs_ext_platform ON public.certificates_external(platform);
CREATE INDEX idx_certs_ext_status ON public.certificates_external(verification_status);
CREATE INDEX idx_cert_skills_user ON public.certificate_skills(user_id);
CREATE INDEX idx_cert_skills_name ON public.certificate_skills(skill_name);

-- RLS
ALTER TABLE public.certificates_external ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_skills ENABLE ROW LEVEL SECURITY;

-- Certificates Policies
CREATE POLICY "Anyone can view verified certificates"
    ON public.certificates_external FOR SELECT USING (
        verification_status = 'verified' OR user_id = auth.uid() OR public.has_role('admin')
    );
CREATE POLICY "Users can upload own certificates"
    ON public.certificates_external FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own pending certificates"
    ON public.certificates_external FOR UPDATE USING (
        user_id = auth.uid() OR public.has_role('admin')
    );
CREATE POLICY "Users can delete own certificates"
    ON public.certificates_external FOR DELETE USING (
        user_id = auth.uid() OR public.has_role('admin')
    );

-- Skills Policies
CREATE POLICY "Anyone can view skills"
    ON public.certificate_skills FOR SELECT USING (true);
CREATE POLICY "System can insert skills"
    ON public.certificate_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can manage own skills"
    ON public.certificate_skills FOR DELETE USING (
        user_id = auth.uid() OR public.has_role('admin')
    );

-- Trigger: Award XP when certificate is verified
CREATE OR REPLACE FUNCTION public.award_xp_on_certificate_verified()
RETURNS trigger AS $$
BEGIN
    IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
        PERFORM public.increment_xp(NEW.user_id, 30, 'Certificate verified: ' || NEW.title, 'certificate', NEW.id);
        PERFORM public.increment_cc(NEW.user_id, 15, 'Certificate verification reward');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_certificate_verified
    AFTER UPDATE ON public.certificates_external
    FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_certificate_verified();
