-- 1. Club Announcements Table
CREATE TABLE IF NOT EXISTS public.club_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view club announcements"
    ON public.club_announcements FOR SELECT
    USING (true);

CREATE POLICY "Club leaders can insert announcements"
    ON public.club_announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_announcements.club_id
            AND user_id = auth.uid()
            AND role IN ('leader', 'president', 'vice_president', 'secretary')
        )
    );

-- 2. Club Positions Table
CREATE TABLE IF NOT EXISTS public.club_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.club_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view club positions"
    ON public.club_positions FOR SELECT
    USING (true);

CREATE POLICY "Club leaders can manage positions"
    ON public.club_positions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_positions.club_id
            AND user_id = auth.uid()
            AND role IN ('leader', 'president', 'vice_president')
        )
    );

-- 3. Club Performance Metrics
ALTER TABLE public.clubs
ADD COLUMN activity_score INT DEFAULT 0,
ADD COLUMN engagement_score INT DEFAULT 0,
ADD COLUMN growth_score INT DEFAULT 0;

-- 4. Update Club Applications Status Enum
-- Currently we might have a CHECK constraint on club_applications.status.
-- Let's drop the constraint if it exists and add a new one.
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT constraint_name INTO con_name
    FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%club_applications_status_check%';

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.club_applications DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE public.club_applications
ADD CONSTRAINT club_applications_status_check
CHECK (status IN ('pending', 'interviewing', 'approved', 'rejected'));

-- Also add position_id to club_applications to track what they applied for
ALTER TABLE public.club_applications
ADD COLUMN position_id UUID REFERENCES public.club_positions(id) ON DELETE SET NULL;

-- 5. Update Club Members Role Enum
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT constraint_name INTO con_name
    FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%club_members_role_check%';

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.club_members DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE public.club_members
ADD CONSTRAINT club_members_role_check
CHECK (role IN ('member', 'moderator', 'leader', 'president', 'vice_president', 'secretary', 'treasurer', 'core_team'));

