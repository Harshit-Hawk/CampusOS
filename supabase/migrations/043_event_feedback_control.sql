-- Migration 043: Event Feedback Control
-- Add feedback_published to events table to control feedback form access

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS feedback_published BOOLEAN DEFAULT false;

-- Create an index to quickly find events with published feedback
CREATE INDEX IF NOT EXISTS idx_events_feedback_published ON public.events(feedback_published);
