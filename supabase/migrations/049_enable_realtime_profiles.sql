-- Enable realtime for profiles table so XP and level updates can be streamed to the client
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
