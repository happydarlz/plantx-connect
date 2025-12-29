-- Drop the problematic RLS policies
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to chats they're in" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;

-- Create a security definer function to check chat membership
CREATE OR REPLACE FUNCTION public.is_chat_member(p_chat_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_id = p_chat_id AND user_id = p_user_id
  )
$$;

-- Create new safe RLS policies for chat_participants
CREATE POLICY "Users can view chat participants of their chats"
ON public.chat_participants FOR SELECT
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Users can add participants to chats"
ON public.chat_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create new safe RLS policy for chats
CREATE POLICY "Users can view their chats"
ON public.chats FOR SELECT
USING (public.is_chat_member(id, auth.uid()));