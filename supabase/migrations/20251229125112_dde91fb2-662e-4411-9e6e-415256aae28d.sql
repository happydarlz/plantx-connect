-- Drop ALL existing policies on chat tables
DROP POLICY IF EXISTS "Chats insert policy" ON public.chats;
DROP POLICY IF EXISTS "Chats select policy" ON public.chats;
DROP POLICY IF EXISTS "Chats delete policy" ON public.chats;
DROP POLICY IF EXISTS "Chat participants insert policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants select policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants delete policy" ON public.chat_participants;
DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;
DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
DROP POLICY IF EXISTS "Messages delete policy" ON public.messages;
DROP POLICY IF EXISTS "Messages update policy" ON public.messages;

-- Create PERMISSIVE policies for chats table
CREATE POLICY "chats_insert" ON public.chats AS PERMISSIVE
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "chats_select" ON public.chats AS PERMISSIVE
FOR SELECT TO authenticated USING (public.is_chat_member(id, auth.uid()));

CREATE POLICY "chats_delete" ON public.chats AS PERMISSIVE
FOR DELETE TO authenticated USING (public.is_chat_member(id, auth.uid()));

-- Create PERMISSIVE policies for chat_participants table
CREATE POLICY "chat_participants_insert" ON public.chat_participants AS PERMISSIVE
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "chat_participants_select" ON public.chat_participants AS PERMISSIVE
FOR SELECT TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "chat_participants_delete" ON public.chat_participants AS PERMISSIVE
FOR DELETE TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

-- Create PERMISSIVE policies for messages table
CREATE POLICY "messages_insert" ON public.messages AS PERMISSIVE
FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "messages_select" ON public.messages AS PERMISSIVE
FOR SELECT TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "messages_delete" ON public.messages AS PERMISSIVE
FOR DELETE TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "messages_update" ON public.messages AS PERMISSIVE
FOR UPDATE TO authenticated USING (public.is_chat_member(chat_id, auth.uid()) AND sender_id <> auth.uid());