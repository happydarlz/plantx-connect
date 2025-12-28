import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Send, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";

// Mock data for chats
const chats = [
  {
    id: "1",
    name: "Green Paradise Nursery",
    username: "greenparadise",
    avatar: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop",
    lastMessage: "Yes, we have Monstera in stock!",
    time: "2m",
    unread: 2,
  },
  {
    id: "2",
    name: "Urban Jungle Co.",
    username: "urbanjungle",
    avatar: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=150&h=150&fit=crop",
    lastMessage: "Thank you for your order 🌿",
    time: "1h",
    unread: 0,
  },
  {
    id: "3",
    name: "Bloom & Grow",
    username: "bloomgrow",
    avatar: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=150&h=150&fit=crop",
    lastMessage: "Sent a photo",
    time: "3h",
    unread: 0,
    hasImage: true,
  },
  {
    id: "4",
    name: "Plant Paradise",
    username: "plantparadise",
    avatar: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=150&h=150&fit=crop",
    lastMessage: "Can you deliver to Mumbai?",
    time: "1d",
    unread: 0,
  },
];

const Chat = () => {
  const [query, setQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(query.toLowerCase()) ||
      chat.username.toLowerCase().includes(query.toLowerCase())
  );

  if (selectedChat) {
    const chat = chats.find((c) => c.id === selectedChat);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat header */}
        <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
          <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-plantx-soft">
            <img src={chat?.avatar} alt={chat?.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{chat?.name}</h2>
            <p className="text-xs text-muted-foreground">@{chat?.username}</p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-secondary rounded-2xl rounded-bl-sm px-4 py-2">
              <p className="text-sm">Hi! I'm interested in your Monstera plant.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2">
              <p className="text-sm">Hello! Yes, we have them in stock. Which size are you looking for?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-secondary rounded-2xl rounded-bl-sm px-4 py-2">
              <p className="text-sm">{chat?.lastMessage}</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex items-center gap-3">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Image className="w-6 h-6 text-muted-foreground" />
          </button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 h-12 rounded-full bg-secondary border-0"
          />
          <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
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
        {filteredChats.map((chat, index) => (
          <motion.button
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
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
                {chat.hasImage && <Image className="w-4 h-4 inline mr-1" />}
                {chat.lastMessage}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
