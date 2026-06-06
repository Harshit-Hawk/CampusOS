-- 009_rollno_edit_tracking.sql

-- Add tracking column for roll_no edits
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_no_updated BOOLEAN DEFAULT FALSE;
