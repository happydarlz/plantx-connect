-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

-- Create a new INSERT policy that allows authenticated users to create chats
CREATE POLICY "Users can create chats" 
ON public.chats 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also need to ensure the chat_participants INSERT policy allows adding both participants
DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;

-- Allow inserting participants - the user creating the chat should be able to add both themselves and the other user
CREATE POLICY "Users can add participants to chats" 
ON public.chat_participants 
FOR INSERT 
TO authenticated
WITH CHECK (true);