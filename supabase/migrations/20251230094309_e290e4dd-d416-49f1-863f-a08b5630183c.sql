-- Add unique constraint on username
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);