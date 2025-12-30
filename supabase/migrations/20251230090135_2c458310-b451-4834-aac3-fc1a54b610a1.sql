-- Add phone_number and user_type columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'normal';

-- Update existing profiles to have 'nursery' type since they were created as nurseries
UPDATE public.profiles SET user_type = 'nursery' WHERE user_type IS NULL OR user_type = 'normal';