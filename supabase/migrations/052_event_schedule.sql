-- 052: Event Day-wise Schedule / Curriculum
-- Allows organizers to add day-wise topics/curriculum for multi-day events with daily attendance

CREATE TABLE IF NOT EXISTS public.event_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    day_title TEXT NOT NULL,          -- e.g. "Day 1 - Introduction to Design Thinking"
    description TEXT,                 -- detailed curriculum/agenda for the day
    speaker TEXT,                     -- optional: speaker or instructor name
    start_time TIME,                  -- optional: session start time
    end_time TIME,                    -- optional: session end time
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, date)
);

CREATE INDEX idx_event_schedule_event ON public.event_schedule(event_id);
CREATE INDEX idx_event_schedule_date ON public.event_schedule(event_id, date);

-- RLS
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;

-- Everyone can view schedule
CREATE POLICY "Anyone can view event schedule" ON public.event_schedule FOR SELECT USING (true);

-- Organizers and admins can manage schedule
CREATE POLICY "Organizers can manage schedule" ON public.event_schedule FOR INSERT WITH CHECK (
    public.has_role('admin') OR
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
);

CREATE POLICY "Organizers can update schedule" ON public.event_schedule FOR UPDATE USING (
    public.has_role('admin') OR
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
);

CREATE POLICY "Organizers can delete schedule" ON public.event_schedule FOR DELETE USING (
    public.has_role('admin') OR
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
);
