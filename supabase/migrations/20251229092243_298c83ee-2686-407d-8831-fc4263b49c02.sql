-- Create reel_comments table for CRUD comments
CREATE TABLE IF NOT EXISTS public.reel_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for reel_comments
CREATE POLICY "Reel comments are viewable by everyone"
ON public.reel_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reel comments"
ON public.reel_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reel comments"
ON public.reel_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel comments"
ON public.reel_comments FOR DELETE
USING (auth.uid() = user_id);