-- Update signup trigger to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, roll_no, email, phone, department, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'roll_no',
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || substr(gen_random_uuid()::text, 1, 4)
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
