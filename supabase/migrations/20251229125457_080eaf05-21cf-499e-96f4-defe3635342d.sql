-- First, drop ALL existing policies on chat tables (both old and new names)
DROP POLICY IF EXISTS "Chats insert policy" ON public.chats;
DROP POLICY IF EXISTS "Chats select policy" ON public.chats;
DROP POLICY IF EXISTS "Chats delete policy" ON public.chats;
DROP POLICY IF EXISTS "chats_insert" ON public.chats;
DROP POLICY IF EXISTS "chats_select" ON public.chats;
DROP POLICY IF EXISTS "chats_delete" ON public.chats;

DROP POLICY IF EXISTS "Chat participants insert policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants select policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants delete policy" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_select" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete" ON public.chat_participants;

DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;
DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
DROP POLICY IF EXISTS "Messages delete policy" ON public.messages;
DROP POLICY IF EXISTS "Messages update policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

-- Create new PERMISSIVE policies for chats
CREATE POLICY "allow_authenticated_insert_chats" ON public.chats
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_member_select_chats" ON public.chats
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_chat_member(id, auth.uid()));

CREATE POLICY "allow_member_delete_chats" ON public.chats
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.is_chat_member(id, auth.uid()));

-- Create new PERMISSIVE policies for chat_participants
CREATE POLICY "allow_authenticated_insert_participants" ON public.chat_participants
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_member_select_participants" ON public.chat_participants
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "allow_member_delete_participants" ON public.chat_participants
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

-- Create new PERMISSIVE policies for messages
CREATE POLICY "allow_sender_insert_messages" ON public.messages
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "allow_member_select_messages" ON public.messages
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "allow_member_delete_messages" ON public.messages
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "allow_member_update_messages" ON public.messages
AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()) AND sender_id <> auth.uid());