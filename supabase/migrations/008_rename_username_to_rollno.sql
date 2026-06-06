-- 008_rename_username_to_rollno.sql

-- 1. Rename column in profiles table
ALTER TABLE profiles RENAME COLUMN username TO roll_no;

-- 2. Update the unique constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_roll_no_key UNIQUE (roll_no);

-- 3. Drop old index and recreate
DROP INDEX IF EXISTS idx_profiles_username;
CREATE INDEX idx_profiles_roll_no ON public.profiles(roll_no);

-- 4. Update the trigger function that creates profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, roll_no, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'roll_no',
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || substr(gen_random_uuid()::text, 1, 4)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
