-- Migration 035: Advanced Volunteer Management
-- Volunteer lifecycle: Application → Approval → Team Assignment → Attendance → Performance → Certificate

-- 1. Volunteer Teams (predefined team types per event)
CREATE TABLE IF NOT EXISTS public.volunteer_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., 'Technical Team', 'Registration Team'
    team_type TEXT NOT NULL CHECK (team_type IN (
        'technical', 'registration', 'hospitality', 'logistics', 'photography', 'media', 'other'
    )),
    max_members INTEGER DEFAULT 10,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, team_type)
);

-- 2. Event Volunteer Assignments (links volunteers to teams + tracks performance)
CREATE TABLE IF NOT EXISTS public.event_volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.volunteer_teams(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    hours_logged DECIMAL(5,2) DEFAULT 0,
    performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
    performance_notes TEXT,
    certificate_issued BOOLEAN DEFAULT false,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, volunteer_id)
);

-- 3. Volunteer Lifetime Stats (materialized view concept, updated via triggers)
CREATE TABLE IF NOT EXISTS public.volunteer_stats (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    leadership_score INTEGER DEFAULT 0, -- based on team lead roles + ratings
    certificates_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_vol_teams_event ON public.volunteer_teams(event_id);
CREATE INDEX idx_vol_assignments_event ON public.event_volunteer_assignments(event_id);
CREATE INDEX idx_vol_assignments_volunteer ON public.event_volunteer_assignments(volunteer_id);
CREATE INDEX idx_vol_assignments_team ON public.event_volunteer_assignments(team_id);
CREATE INDEX idx_vol_assignments_status ON public.event_volunteer_assignments(status);
CREATE INDEX idx_vol_stats_hours ON public.volunteer_stats(total_hours DESC);

-- RLS
ALTER TABLE public.volunteer_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_stats ENABLE ROW LEVEL SECURITY;

-- Volunteer Teams Policies
CREATE POLICY "Anyone can view volunteer teams"
    ON public.volunteer_teams FOR SELECT USING (true);
CREATE POLICY "Organizers and admins can manage teams"
    ON public.volunteer_teams FOR ALL USING (
        public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
    );

-- Volunteer Assignments Policies
CREATE POLICY "Anyone can view assignments"
    ON public.event_volunteer_assignments FOR SELECT USING (true);
CREATE POLICY "Users can apply as volunteers"
    ON public.event_volunteer_assignments FOR INSERT
    WITH CHECK (volunteer_id = auth.uid());
CREATE POLICY "Organizers and admins can update assignments"
    ON public.event_volunteer_assignments FOR UPDATE USING (
        public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
    );
CREATE POLICY "Users can delete own pending applications"
    ON public.event_volunteer_assignments FOR DELETE USING (
        volunteer_id = auth.uid() AND status = 'pending'
    );

-- Volunteer Stats Policies
CREATE POLICY "Anyone can view volunteer stats"
    ON public.volunteer_stats FOR SELECT USING (true);

-- Trigger: Update volunteer stats when assignment is completed
CREATE OR REPLACE FUNCTION public.update_volunteer_stats()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Upsert volunteer stats
        INSERT INTO public.volunteer_stats (user_id, total_hours, total_events, avg_rating, certificates_earned)
        VALUES (NEW.volunteer_id, COALESCE(NEW.hours_logged, 0), 1, COALESCE(NEW.performance_rating, 0), 0)
        ON CONFLICT (user_id) DO UPDATE SET
            total_hours = public.volunteer_stats.total_hours + COALESCE(NEW.hours_logged, 0),
            total_events = public.volunteer_stats.total_events + 1,
            avg_rating = CASE
                WHEN NEW.performance_rating IS NOT NULL THEN
                    (public.volunteer_stats.avg_rating * (public.volunteer_stats.total_events) + NEW.performance_rating)
                    / (public.volunteer_stats.total_events + 1)
                ELSE public.volunteer_stats.avg_rating
            END,
            updated_at = now();

        -- Award XP for volunteer completion
        PERFORM public.increment_xp(NEW.volunteer_id, 25, 'Completed volunteer duty', 'volunteer', NEW.event_id);

        -- Award Campus Coins
        PERFORM public.increment_cc(NEW.volunteer_id, 10, 'Volunteer completion reward');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_volunteer_assignment_update
    AFTER UPDATE ON public.event_volunteer_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_volunteer_stats();
