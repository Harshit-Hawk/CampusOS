-- Migration: Add category to events

-- Add category column to events table, defaulting to 'competitive' for backwards compatibility
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text DEFAULT 'competitive';

-- Update existing rows to ensure they have the default value (if they were inserted while the column was being created)
UPDATE public.events SET category = 'competitive' WHERE category IS NULL;
