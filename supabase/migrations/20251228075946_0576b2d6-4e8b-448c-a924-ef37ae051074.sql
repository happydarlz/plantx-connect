-- Create reel_saves table similar to post_saves
CREATE TABLE public.reel_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (reel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reel_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can save reels"
ON public.reel_saves
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave reels"
ON public.reel_saves
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved reels"
ON public.reel_saves
FOR SELECT
USING (auth.uid() = user_id);