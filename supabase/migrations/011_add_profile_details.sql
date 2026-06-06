-- 011_add_profile_details.sql
ALTER TABLE public.profiles
ADD COLUMN course text,
ADD COLUMN semester integer,
ADD COLUMN phone text;
