-- First, drop all existing policies on chat tables
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to chats they're in" ON public.messages;
DROP POLICY IF EXISTS "Users can mark messages as read in their chats" ON public.messages;

-- Recreate chat policies as PERMISSIVE (default)
-- CHATS table policies
CREATE POLICY "Anyone authenticated can create chats"
ON public.chats FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Members can view their chats"
ON public.chats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_id = id
    AND chat_participants.user_id = auth.uid()
  )
);

-- CHAT_PARTICIPANTS table policies
CREATE POLICY "Anyone authenticated can add participants"
ON public.chat_participants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Members can view participants"
ON public.chat_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
  )
);

-- MESSAGES table policies
CREATE POLICY "Members can view chat messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_id = messages.chat_id
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_id = messages.chat_id
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update message read status"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_id = messages.chat_id
    AND chat_participants.user_id = auth.uid()
  ) AND sender_id != auth.uid()
);