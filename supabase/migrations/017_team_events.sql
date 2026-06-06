-- ============================================
-- Feature: Team Events
-- Description: Allows events to be created as team events, requiring 
--              users to create or join a team upon registration.
-- ============================================

-- 1. Add team properties to the events table
ALTER TABLE public.events 
  ADD COLUMN is_team_event boolean DEFAULT false,
  ADD COLUMN min_team_size integer DEFAULT 1,
  ADD COLUMN max_team_size integer;

-- 2. Create event_teams table
CREATE TABLE public.event_teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Add team_id to event_registrations
ALTER TABLE public.event_registrations 
  ADD COLUMN team_id uuid REFERENCES public.event_teams(id) ON DELETE CASCADE;

-- 4. Enable RLS on event_teams
ALTER TABLE public.event_teams ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for event_teams
-- Anyone can view teams
CREATE POLICY "Teams are viewable by everyone."
  ON public.event_teams FOR SELECT
  USING (true);

-- Authenticated users can create teams
CREATE POLICY "Users can create teams"
  ON public.event_teams FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Team creators can update their teams
CREATE POLICY "Team creators can update teams"
  ON public.event_teams FOR UPDATE
  USING (auth.uid() = creator_id);

-- Team creators can delete their teams
CREATE POLICY "Team creators can delete teams"
  ON public.event_teams FOR DELETE
  USING (auth.uid() = creator_id);
