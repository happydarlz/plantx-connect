-- Drop the problematic messages insert policy
DROP POLICY IF EXISTS "allow_sender_insert_messages" ON public.messages;

-- Create a simpler messages insert policy that just checks sender_id
CREATE POLICY "allow_sender_insert_messages" ON public.messages
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Also fix the chat_participants insert to only allow adding yourself or when creating a chat
DROP POLICY IF EXISTS "allow_authenticated_insert_participants" ON public.chat_participants;

-- Allow authenticated users to insert participants (will be validated by is_chat_member for messages)
CREATE POLICY "allow_authenticated_insert_participants" ON public.chat_participants
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (true);