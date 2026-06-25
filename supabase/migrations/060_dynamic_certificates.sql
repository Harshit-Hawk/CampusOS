-- Migration 060: Dynamic Certificates Generation

-- Add configuration fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS certificate_template_url TEXT,
ADD COLUMN IF NOT EXISTS cert_text_x INTEGER,
ADD COLUMN IF NOT EXISTS cert_text_y INTEGER,
ADD COLUMN IF NOT EXISTS cert_font_size INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS cert_text_color TEXT DEFAULT '#000000';

-- Add 'event_certificate' to platform enum in certificates_external if not exists
-- PostgreSQL doesn't support adding to an enum safely if used in checks without a bit of work,
-- but the constraint is a CHECK constraint, not an ENUM type. Let's update the CHECK constraint.

ALTER TABLE public.certificates_external DROP CONSTRAINT IF EXISTS certificates_external_platform_check;
ALTER TABLE public.certificates_external ADD CONSTRAINT certificates_external_platform_check CHECK (
    platform IN (
        'ibm', 'google', 'microsoft', 'cisco', 'aws', 'coursera', 'udemy',
        'nptel', 'hackathon', 'workshop', 'internship', 'other', 'event_certificate'
    )
);
