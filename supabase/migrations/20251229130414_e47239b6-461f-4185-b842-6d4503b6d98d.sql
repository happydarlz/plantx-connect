-- Drop ALL existing policies on chat tables first
DROP POLICY IF EXISTS "allow_authenticated_insert_chats" ON public.chats;
DROP POLICY IF EXISTS "allow_member_delete_chats" ON public.chats;
DROP POLICY IF EXISTS "allow_member_select_chats" ON public.chats;
DROP POLICY IF EXISTS "allow_authenticated_insert_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "allow_member_delete_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "allow_member_select_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "allow_member_delete_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_member_select_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_member_update_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_sender_insert_messages" ON public.messages;

-- Also drop any old policy names that might exist
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their chats" ON public.chats;
DROP POLICY IF EXISTS "Chat participants viewable by members" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can delete participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Messages viewable by chat members" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;

-- Temporarily disable RLS to clear state
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create fresh PERMISSIVE policies for chats
CREATE POLICY "chat_insert_policy" ON public.chats
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "chat_select_policy" ON public.chats
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chat_member(id, auth.uid()));

CREATE POLICY "chat_delete_policy" ON public.chats
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.is_chat_member(id, auth.uid()));

-- Create fresh PERMISSIVE policies for chat_participants
CREATE POLICY "participant_insert_policy" ON public.chat_participants
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "participant_select_policy" ON public.chat_participants
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "participant_delete_policy" ON public.chat_participants
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.is_chat_member(chat_id, auth.uid()));

-- Create fresh PERMISSIVE policies for messages
CREATE POLICY "message_insert_policy" ON public.messages
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "message_select_policy" ON public.messages
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "message_update_policy" ON public.messages
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_chat_member(chat_id, auth.uid()) AND sender_id <> auth.uid());

CREATE POLICY "message_delete_policy" ON public.messages
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.is_chat_member(chat_id, auth.uid()));