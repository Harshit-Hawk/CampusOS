-- Migration: Add faculty_coordinator_id to clubs table

ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS faculty_coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
