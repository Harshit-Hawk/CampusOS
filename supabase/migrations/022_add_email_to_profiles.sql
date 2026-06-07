-- 022_add_email_to_profiles.sql

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
