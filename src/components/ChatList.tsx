import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ChatPreview {
  id: string;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const ChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([]);

  useEffect(() => {
    if (user) {
      fetchChats();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('home-messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            fetchChats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      // Get user's chat participants
      const { data: participantData } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (!participantData || participantData.length === 0) return;

      const chatIds = participantData.map(p => p.chat_id);

      // For each chat, get the other participant and last message
      const chatPreviews: ChatPreview[] = [];

      for (const chatId of chatIds) {
        // Get other participant
        const { data: otherParticipant } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chatId)
          .neq("user_id", user.id)
          .maybeSingle();

        if (!otherParticipant) continue;

        // Get their profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, nursery_name, profile_image")
          .eq("user_id", otherParticipant.user_id)
          .maybeSingle();

        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender_id, read_at")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact" })
          .eq("chat_id", chatId)
          .neq("sender_id", user.id)
          .is("read_at", null);

        if (profileData) {
          chatPreviews.push({
            id: chatId,
            name: profileData.nursery_name,
            username: profileData.username,
            avatar: profileData.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop",
            lastMessage: lastMessage?.content || "Start a conversation",
            time: lastMessage ? formatTime(lastMessage.created_at) : "",
            unread: unreadCount || 0,
          });
        }
      }

      setChats(chatPreviews.slice(0, 5)); // Show max 5 chats
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const formatTime = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (chats.length === 0) return null;

  return (
    <section className="px-4 py-2 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        <button 
          onClick={() => navigate("/chat")}
          className="text-xs text-primary font-medium"
        >
          See All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar">
        {chats.map((chat, index) => (
          <motion.button
            key={chat.id}
            onClick={() => navigate("/chat")}
            className="flex flex-col items-center min-w-[60px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-plantx-soft">
                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              </div>
              {chat.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {chat.unread}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[60px]">
              {chat.username}
            </span>
          </motion.button>
        ))}
        <motion.button
          onClick={() => navigate("/chat")}
          className="flex flex-col items-center min-w-[60px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-border">
            <MessageCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">All Chats</span>
        </motion.button>
      </div>
    </section>
  );
};

export default ChatList;
