-- Add username column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create an index to make lookups by username fast
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);
