-- Add UPDATE policy for messages to allow marking as read
CREATE POLICY "Users can mark messages as read in their chats"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = messages.chat_id
    AND chat_participants.user_id = auth.uid()
  )
  AND sender_id != auth.uid()
);

-- Add plant_likes table for liking plants
CREATE TABLE public.plant_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plant_id, user_id)
);

-- Enable RLS on plant_likes
ALTER TABLE public.plant_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for plant_likes
CREATE POLICY "Plant likes are viewable by everyone"
ON public.plant_likes FOR SELECT USING (true);

CREATE POLICY "Users can like plants"
ON public.plant_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike plants"
ON public.plant_likes FOR DELETE USING (auth.uid() = user_id);

-- Add plant_saves table for saving plants
CREATE TABLE public.plant_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plant_id, user_id)
);

-- Enable RLS on plant_saves
ALTER TABLE public.plant_saves ENABLE ROW LEVEL SECURITY;

-- RLS policies for plant_saves
CREATE POLICY "Users can view their own plant saves"
ON public.plant_saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save plants"
ON public.plant_saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave plants"
ON public.plant_saves FOR DELETE USING (auth.uid() = user_id);

-- Add plant_comments table
CREATE TABLE public.plant_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on plant_comments
ALTER TABLE public.plant_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for plant_comments
CREATE POLICY "Plant comments are viewable by everyone"
ON public.plant_comments FOR SELECT USING (true);

CREATE POLICY "Users can insert their own plant comments"
ON public.plant_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plant comments"
ON public.plant_comments FOR DELETE USING (auth.uid() = user_id);