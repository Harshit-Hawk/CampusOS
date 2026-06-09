-- Migration: Event Winners Leaderboard

CREATE TABLE IF NOT EXISTS public.event_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.event_teams(id) ON DELETE CASCADE,
    placement INTEGER NOT NULL CHECK (placement IN (1, 2, 3)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- An entry must have either a user_id or team_id, but not both
    CONSTRAINT winner_has_subject CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    -- Each placement can only be awarded once per event
    CONSTRAINT unique_placement_per_event UNIQUE (event_id, placement)
);

ALTER TABLE public.event_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event winners"
    ON public.event_winners FOR SELECT
    USING (true);

-- Event organizers and admins can manage winners
CREATE POLICY "Organizers and Admins can manage winners"
    ON public.event_winners FOR ALL
    USING (
        public.has_role('admin') OR
        auth.uid() IN (SELECT organizer_id FROM public.events WHERE id = event_id)
    );
