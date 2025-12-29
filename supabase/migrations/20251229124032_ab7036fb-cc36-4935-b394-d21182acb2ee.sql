-- Fix infinite recursion in chat RLS policies by using security definer functions

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Members can view participants" ON chat_participants;
DROP POLICY IF EXISTS "Anyone authenticated can add participants" ON chat_participants;
DROP POLICY IF EXISTS "Members can view their chats" ON chats;
DROP POLICY IF EXISTS "Anyone authenticated can create chats" ON chats;
DROP POLICY IF EXISTS "Members can view chat messages" ON messages;
DROP POLICY IF EXISTS "Members can send messages" ON messages;
DROP POLICY IF EXISTS "Members can update message read status" ON messages;

-- The is_chat_member function already exists as security definer, we'll use it

-- Recreate chats policies (simple, no recursion risk)
CREATE POLICY "Chats insert policy"
ON chats FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Chats select policy"
ON chats FOR SELECT TO authenticated
USING (public.is_chat_member(id, auth.uid()));

CREATE POLICY "Chats delete policy"
ON chats FOR DELETE TO authenticated
USING (public.is_chat_member(id, auth.uid()));

-- Recreate chat_participants policies (use security definer function to avoid recursion)
CREATE POLICY "Chat participants insert policy"
ON chat_participants FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Chat participants select policy"
ON chat_participants FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Chat participants delete policy"
ON chat_participants FOR DELETE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

-- Recreate messages policies
CREATE POLICY "Messages select policy"
ON messages FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Messages insert policy"
ON messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Messages update policy"
ON messages FOR UPDATE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()) AND sender_id <> auth.uid());

CREATE POLICY "Messages delete policy"
ON messages FOR DELETE TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));