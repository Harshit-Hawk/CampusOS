-- Migration 038: Placement Hub
-- Resume builder, ATS checker, internship portal, placement dashboard, mock interviews

-- 1. Resumes (JSON-based for flexible builder)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    template TEXT DEFAULT 'professional' CHECK (template IN ('professional', 'modern', 'minimal')),
    data JSONB NOT NULL DEFAULT '{
        "personal": {},
        "summary": "",
        "education": [],
        "experience": [],
        "projects": [],
        "skills": [],
        "certifications": [],
        "achievements": []
    }'::jsonb,
    ats_score INTEGER, -- 0-100
    ats_feedback JSONB, -- AI feedback details
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Internship Listings
CREATE TABLE IF NOT EXISTS public.internship_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    company TEXT NOT NULL,
    role_title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    stipend TEXT, -- e.g., '₹10,000/month' or 'Unpaid'
    location TEXT,
    work_type TEXT DEFAULT 'onsite' CHECK (work_type IN ('onsite', 'remote', 'hybrid')),
    duration TEXT, -- e.g., '3 months'
    department_tags TEXT[] DEFAULT '{}',
    application_url TEXT,
    application_deadline TIMESTAMP WITH TIME ZONE,
    max_applicants INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Internship Applications
CREATE TABLE IF NOT EXISTS public.internship_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.internship_listings(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    cover_letter TEXT,
    status TEXT DEFAULT 'applied' CHECK (status IN (
        'applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'
    )),
    status_notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(listing_id, applicant_id)
);

-- 4. Placement Records (historical data)
CREATE TABLE IF NOT EXISTS public.placement_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year TEXT NOT NULL, -- e.g., '2024-25'
    department TEXT NOT NULL,
    company TEXT NOT NULL,
    role_title TEXT,
    package_lpa DECIMAL(6,2), -- Lakhs per annum
    students_placed INTEGER DEFAULT 1,
    placement_type TEXT DEFAULT 'campus' CHECK (placement_type IN ('campus', 'off-campus', 'internship')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Mock Interview Sessions
CREATE TABLE IF NOT EXISTS public.mock_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'hr', 'behavioral')),
    domain TEXT, -- e.g., 'Data Structures', 'System Design'
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {question, answer, ai_evaluation, score}
    total_score INTEGER, -- 0-100
    ai_feedback TEXT,
    duration_minutes INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_resumes_user ON public.resumes(user_id);
CREATE INDEX idx_internship_listings_active ON public.internship_listings(is_active);
CREATE INDEX idx_internship_listings_deadline ON public.internship_listings(application_deadline);
CREATE INDEX idx_internship_apps_listing ON public.internship_applications(listing_id);
CREATE INDEX idx_internship_apps_applicant ON public.internship_applications(applicant_id);
CREATE INDEX idx_internship_apps_status ON public.internship_applications(status);
CREATE INDEX idx_placement_records_year ON public.placement_records(academic_year);
CREATE INDEX idx_placement_records_dept ON public.placement_records(department);
CREATE INDEX idx_mock_interviews_user ON public.mock_interviews(user_id);

-- RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

-- Resumes Policies
CREATE POLICY "Users can view own resumes"
    ON public.resumes FOR SELECT USING (user_id = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Users can create own resumes"
    ON public.resumes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own resumes"
    ON public.resumes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own resumes"
    ON public.resumes FOR DELETE USING (user_id = auth.uid());

-- Internship Listings Policies
CREATE POLICY "Anyone can view active listings"
    ON public.internship_listings FOR SELECT USING (is_active = true OR posted_by = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Alumni and admins can post listings"
    ON public.internship_listings FOR INSERT WITH CHECK (
        posted_by = auth.uid() AND (public.has_role('admin') OR public.has_role('alumni'))
    );
CREATE POLICY "Authors can update own listings"
    ON public.internship_listings FOR UPDATE USING (posted_by = auth.uid() OR public.has_role('admin'));

-- Internship Applications Policies
CREATE POLICY "Applicants and listing owners can view applications"
    ON public.internship_applications FOR SELECT USING (
        applicant_id = auth.uid() OR public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.internship_listings WHERE id = listing_id AND posted_by = auth.uid())
    );
CREATE POLICY "Users can apply to internships"
    ON public.internship_applications FOR INSERT WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "Applicants and admins can update applications"
    ON public.internship_applications FOR UPDATE USING (
        applicant_id = auth.uid() OR public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.internship_listings WHERE id = listing_id AND posted_by = auth.uid())
    );

-- Placement Records Policies
CREATE POLICY "Anyone can view placement records"
    ON public.placement_records FOR SELECT USING (true);
CREATE POLICY "Admins can manage placement records"
    ON public.placement_records FOR ALL USING (public.has_role('admin'));

-- Mock Interviews Policies
CREATE POLICY "Users can view own mock interviews"
    ON public.mock_interviews FOR SELECT USING (user_id = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Users can create mock interviews"
    ON public.mock_interviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own mock interviews"
    ON public.mock_interviews FOR UPDATE USING (user_id = auth.uid());
