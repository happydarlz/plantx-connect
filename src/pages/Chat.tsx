import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Send, Image, ArrowLeft, Paperclip, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ChatPreview {
  id: string;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  otherUserId: string;
}

interface Message {
  id: string;
  content: string | null;
  image_url: string | null;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatData, setSelectedChatData] = useState<ChatPreview | null>(null);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchChats();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      markAsRead();

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat-${selectedChat}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${selectedChat}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data: participantData } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (!participantData || participantData.length === 0) {
        setIsLoading(false);
        return;
      }

      const chatPreviews: ChatPreview[] = [];

      for (const participant of participantData) {
        const { data: otherParticipant } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", participant.chat_id)
          .neq("user_id", user.id)
          .maybeSingle();

        if (!otherParticipant) continue;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, nursery_name, profile_image")
          .eq("user_id", otherParticipant.user_id)
          .maybeSingle();

        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, image_url")
          .eq("chat_id", participant.chat_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact" })
          .eq("chat_id", participant.chat_id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        if (profileData) {
          chatPreviews.push({
            id: participant.chat_id,
            name: profileData.nursery_name,
            username: profileData.username,
            avatar: profileData.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150",
            lastMessage: lastMessage?.image_url ? "📷 Photo" : lastMessage?.content || "Start chatting",
            time: lastMessage ? formatTime(lastMessage.created_at) : "",
            unread: unreadCount || 0,
            otherUserId: otherParticipant.user_id,
          });
        }
      }

      setChats(chatPreviews);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", selectedChat)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const markAsRead = async () => {
    if (!selectedChat || !user) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("chat_id", selectedChat)
      .neq("sender_id", user.id)
      .is("read_at", null);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: selectedChat,
        sender_id: user.id,
        content: message.trim(),
      });

      if (error) throw error;
      setMessage("");
    } catch (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const sendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !user) return;

    setIsSending(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/messages/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(filePath);

      const { error } = await supabase.from("messages").insert({
        chat_id: selectedChat,
        sender_id: user.id,
        image_url: publicUrl,
      });

      if (error) throw error;
    } catch (error) {
      toast({ title: "Failed to send image", variant: "destructive" });
    } finally {
      setIsSending(false);
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

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(query.toLowerCase()) ||
      chat.username.toLowerCase().includes(query.toLowerCase())
  );

  if (selectedChat && selectedChatData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat header */}
        <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedChat(null);
              setSelectedChatData(null);
            }}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-plantx-soft cursor-pointer"
            onClick={() => navigate(`/user/${selectedChatData.username}`)}
          >
            <img src={selectedChatData.avatar} alt={selectedChatData.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1" onClick={() => navigate(`/user/${selectedChatData.username}`)}>
            <h2 className="font-semibold text-foreground">{selectedChatData.name}</h2>
            <p className="text-xs text-muted-foreground">@{selectedChatData.username}</p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender_id === user?.id
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary rounded-bl-sm"
                }`}
              >
                {msg.image_url && (
                  <img src={msg.image_url} alt="" className="rounded-lg max-w-full mb-2" />
                )}
                {msg.content && <p className="text-sm">{msg.content}</p>}
                <p
                  className={`text-[10px] mt-1 ${
                    msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatMessageTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex items-center gap-3">
          <label className="p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer">
            <input type="file" accept="image/*" onChange={sendImage} className="hidden" />
            <Image className="w-6 h-6 text-muted-foreground" />
          </label>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 h-12 rounded-full bg-secondary border-0"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isSending}
            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 px-4 pt-4 pb-3">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Messages</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-secondary border-0"
          />
        </div>
      </header>

      {/* Chat list */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start chatting with nurseries!</p>
          </div>
        ) : (
          filteredChats.map((chat, index) => (
            <motion.button
              key={chat.id}
              onClick={() => {
                setSelectedChat(chat.id);
                setSelectedChatData(chat);
              }}
              className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-plantx-soft">
                  <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                </div>
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                    {chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{chat.name}</h3>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
