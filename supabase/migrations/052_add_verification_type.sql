-- Migration 052: Add verification_type
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50) DEFAULT 'student';
