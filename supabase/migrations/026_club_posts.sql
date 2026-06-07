-- Migration: Add club_id to posts

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
