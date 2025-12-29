-- Drop all existing policies on chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;

-- Create PERMISSIVE policies for chats
CREATE POLICY "Users can create chats" 
ON public.chats 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their chats" 
ON public.chats 
FOR SELECT 
TO authenticated
USING (is_chat_member(id, auth.uid()));

-- Drop all existing policies on chat_participants
DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;

-- Create PERMISSIVE policies for chat_participants
CREATE POLICY "Users can add participants to chats" 
ON public.chat_participants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view chat participants of their chats" 
ON public.chat_participants 
FOR SELECT 
TO authenticated
USING (is_chat_member(chat_id, auth.uid()));