-- Migration: Volunteer Scanner Access

-- Add can_scan column to event_volunteers table
ALTER TABLE public.event_volunteers ADD COLUMN IF NOT EXISTS can_scan boolean DEFAULT false;

-- Update existing rows to ensure they have the default value
UPDATE public.event_volunteers SET can_scan = false WHERE can_scan IS NULL;
