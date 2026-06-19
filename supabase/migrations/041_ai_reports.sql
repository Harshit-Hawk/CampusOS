-- Migration 041: AI Reports & Chat Sessions
-- Event report generation, feedback collection, AI conversation history

-- 1. Event Feedback (post-event surveys)
CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    content_rating INTEGER CHECK (content_rating BETWEEN 1 AND 5),
    organization_rating INTEGER CHECK (organization_rating BETWEEN 1 AND 5),
    venue_rating INTEGER CHECK (venue_rating BETWEEN 1 AND 5),
    comments TEXT,
    suggestions TEXT,
    would_recommend BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, user_id)
);

-- 2. Generated Event Reports
CREATE TABLE IF NOT EXISTS public.event_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- report_data structure:
    -- {
    --   "summary": "...",
    --   "total_registrations": N,
    --   "total_attendees": N,
    --   "department_breakdown": {...},
    --   "attendance_rate": N,
    --   "feedback_summary": {...},
    --   "volunteer_stats": {...},
    --   "winners": [...],
    --   "success_metrics": {...},
    --   "improvement_suggestions": [...]
    -- }
    ai_summary TEXT,
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. AI Chat Sessions (CampusAI conversation history)
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- messages structure: [{role: 'user'|'assistant', content: '...', timestamp: '...'}]
    context_type TEXT DEFAULT 'general' CHECK (context_type IN (
        'general', 'academic', 'career', 'events', 'attendance', 'performance'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_event_feedback_event ON public.event_feedback(event_id);
CREATE INDEX idx_event_feedback_user ON public.event_feedback(user_id);
CREATE INDEX idx_event_reports_event ON public.event_reports(event_id);
CREATE INDEX idx_ai_chat_sessions_user ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_updated ON public.ai_chat_sessions(updated_at DESC);

-- RLS
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Event Feedback Policies
CREATE POLICY "Organizers and admins can view feedback"
    ON public.event_feedback FOR SELECT USING (
        user_id = auth.uid() OR public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
    );
CREATE POLICY "Attendees can submit feedback"
    ON public.event_feedback FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own feedback"
    ON public.event_feedback FOR UPDATE USING (user_id = auth.uid());

-- Event Reports Policies
CREATE POLICY "Organizers and admins can view reports"
    ON public.event_reports FOR SELECT USING (
        public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
    );
CREATE POLICY "Organizers and admins can generate reports"
    ON public.event_reports FOR INSERT WITH CHECK (
        public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
    );
CREATE POLICY "System can update reports"
    ON public.event_reports FOR UPDATE USING (true);

-- AI Chat Policies
CREATE POLICY "Users can view own chats"
    ON public.ai_chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create chats"
    ON public.ai_chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own chats"
    ON public.ai_chat_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own chats"
    ON public.ai_chat_sessions FOR DELETE USING (user_id = auth.uid());
