-- Add profile_links column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_links jsonb DEFAULT '[]'::jsonb;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  from_user_id uuid NOT NULL,
  post_id uuid,
  message_text text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications for others"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can mark their notifications as read"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Add multiple images support to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- Add multiple images support to plants
ALTER TABLE public.plants
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];