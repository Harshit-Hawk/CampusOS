-- Migration 056: Custom Feedback Questions
-- Allows event organizers to define custom feedback questions
-- and stores student responses as JSONB

-- Add custom feedback questions to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS feedback_questions JSONB DEFAULT '[]'::jsonb;

-- Add custom answers to event_feedback table
ALTER TABLE public.event_feedback
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;
