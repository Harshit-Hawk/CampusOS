-- Migration 037: Alumni Network
-- Automatic student → alumni transition, directory, mentorship, referrals

-- 1. Alumni Profiles (extended data beyond base profile)
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company TEXT,
    position TEXT,
    industry TEXT,
    location TEXT,
    graduation_year INTEGER,
    graduation_batch TEXT,
    linkedin_url TEXT,
    is_mentor_available BOOLEAN DEFAULT false,
    mentor_topics TEXT[] DEFAULT '{}', -- e.g., ['software engineering', 'data science']
    bio_professional TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Mentorship Requests
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    response_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, alumni_id, topic)
);

-- 3. Job Referrals
CREATE TABLE IF NOT EXISTS public.job_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    company TEXT NOT NULL,
    role_title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    job_type TEXT DEFAULT 'full-time' CHECK (job_type IN (
        'full-time', 'part-time', 'internship', 'contract', 'freelance'
    )),
    application_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Alumni Success Stories
CREATE TABLE IF NOT EXISTS public.alumni_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_alumni_profiles_user ON public.alumni_profiles(user_id);
CREATE INDEX idx_alumni_profiles_company ON public.alumni_profiles(company);
CREATE INDEX idx_alumni_profiles_industry ON public.alumni_profiles(industry);
CREATE INDEX idx_alumni_profiles_grad_year ON public.alumni_profiles(graduation_year);
CREATE INDEX idx_mentorship_student ON public.mentorship_requests(student_id);
CREATE INDEX idx_mentorship_alumni ON public.mentorship_requests(alumni_id);
CREATE INDEX idx_mentorship_status ON public.mentorship_requests(status);
CREATE INDEX idx_job_referrals_posted_by ON public.job_referrals(posted_by);
CREATE INDEX idx_job_referrals_active ON public.job_referrals(is_active);
CREATE INDEX idx_alumni_stories_alumni ON public.alumni_stories(alumni_id);

-- RLS
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_stories ENABLE ROW LEVEL SECURITY;

-- Alumni Profiles Policies
CREATE POLICY "Anyone can view alumni profiles"
    ON public.alumni_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own alumni profile"
    ON public.alumni_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert alumni profiles"
    ON public.alumni_profiles FOR INSERT WITH CHECK (
        user_id = auth.uid() OR public.has_role('admin')
    );

-- Mentorship Policies
CREATE POLICY "Involved parties can view mentorship requests"
    ON public.mentorship_requests FOR SELECT USING (
        student_id = auth.uid() OR alumni_id = auth.uid() OR public.has_role('admin')
    );
CREATE POLICY "Students can create mentorship requests"
    ON public.mentorship_requests FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Alumni can update mentorship requests"
    ON public.mentorship_requests FOR UPDATE USING (
        alumni_id = auth.uid() OR public.has_role('admin')
    );

-- Job Referrals Policies
CREATE POLICY "Anyone can view active referrals"
    ON public.job_referrals FOR SELECT USING (is_active = true OR posted_by = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Alumni can post referrals"
    ON public.job_referrals FOR INSERT WITH CHECK (posted_by = auth.uid());
CREATE POLICY "Authors can update own referrals"
    ON public.job_referrals FOR UPDATE USING (posted_by = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Authors can delete own referrals"
    ON public.job_referrals FOR DELETE USING (posted_by = auth.uid() OR public.has_role('admin'));

-- Alumni Stories Policies
CREATE POLICY "Anyone can view approved stories"
    ON public.alumni_stories FOR SELECT USING (is_approved = true OR alumni_id = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Alumni can submit stories"
    ON public.alumni_stories FOR INSERT WITH CHECK (alumni_id = auth.uid());
CREATE POLICY "Alumni can update own stories"
    ON public.alumni_stories FOR UPDATE USING (alumni_id = auth.uid() OR public.has_role('admin'));

-- Function: Convert student to alumni (called by admin)
CREATE OR REPLACE FUNCTION public.convert_to_alumni(
    target_user_id UUID,
    grad_year INTEGER,
    grad_batch TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Update role to alumni
    UPDATE public.profiles SET role = 'alumni', updated_at = now() WHERE id = target_user_id;

    -- Create alumni profile
    INSERT INTO public.alumni_profiles (user_id, graduation_year, graduation_batch)
    VALUES (target_user_id, grad_year, grad_batch)
    ON CONFLICT (user_id) DO UPDATE SET
        graduation_year = grad_year,
        graduation_batch = COALESCE(grad_batch, public.alumni_profiles.graduation_batch),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
