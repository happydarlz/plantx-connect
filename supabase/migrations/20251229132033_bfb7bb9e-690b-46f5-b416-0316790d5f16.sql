-- COMPLETE RESET of chat RLS policies
-- Drop ALL existing policies with any possible names

-- Drop policies on chats
DROP POLICY IF EXISTS "chat_insert_policy" ON public.chats;
DROP POLICY IF EXISTS "chat_select_policy" ON public.chats;
DROP POLICY IF EXISTS "chat_delete_policy" ON public.chats;
DROP POLICY IF EXISTS "chat_update_policy" ON public.chats;

-- Drop policies on chat_participants
DROP POLICY IF EXISTS "participant_insert_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "participant_select_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "participant_delete_policy" ON public.chat_participants;
DROP POLICY IF EXISTS "participant_update_policy" ON public.chat_participants;

-- Drop policies on messages
DROP POLICY IF EXISTS "message_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "message_select_policy" ON public.messages;
DROP POLICY IF EXISTS "message_delete_policy" ON public.messages;
DROP POLICY IF EXISTS "message_update_policy" ON public.messages;

-- Disable RLS temporarily
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- CHATS: Simple policies
-- Any authenticated user can create a chat
CREATE POLICY "chats_insert" ON public.chats
FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can see chats they're part of
CREATE POLICY "chats_select" ON public.chats
FOR SELECT TO authenticated
USING (public.is_chat_member(id, auth.uid()));

-- Users can delete chats they're part of
CREATE POLICY "chats_delete" ON public.chats
FOR DELETE TO authenticated
USING (public.is_chat_member(id, auth.uid()));

-- CHAT_PARTICIPANTS: Simple policies
-- Any authenticated user can add participants
CREATE POLICY "participants_insert" ON public.chat_participants
FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can see participants of chats they're in
CREATE POLICY "participants_select" ON public.chat_participants
FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

-- Users can remove participants from chats they're in
CREATE POLICY "participants_delete" ON public.chat_participants
FOR DELETE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

-- MESSAGES: Simple policies
-- Users can send messages (must be sender)
CREATE POLICY "messages_insert" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Users can see messages in their chats
CREATE POLICY "messages_select" ON public.messages
FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

-- Users can update messages in their chats (for read receipts)
CREATE POLICY "messages_update" ON public.messages
FOR UPDATE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

-- Users can delete messages in their chats
CREATE POLICY "messages_delete" ON public.messages
FOR DELETE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));