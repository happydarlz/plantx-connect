import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Notification {
  id: string;
  type: string;
  from_user_id: string;
  is_read: boolean;
  created_at: string;
  message_text: string | null;
  from_profile?: {
    username: string;
    profile_image: string | null;
    nursery_name: string;
  };
}

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsSheet = ({ open, onOpenChange }: NotificationsSheetProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchNotifications();
      markAsRead();
      
      // Subscribe to realtime notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for each notification
      const notificationsWithProfiles = await Promise.all(
        (data || []).map(async (notif) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, profile_image, nursery_name")
            .eq("user_id", notif.from_user_id)
            .maybeSingle();
          return { ...notif, from_profile: profileData };
        })
      );

      setNotifications(notificationsWithProfiles);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notif: Notification) => {
    const username = notif.from_profile?.username || "Someone";
    switch (notif.type) {
      case "like":
        return `${username} liked your post`;
      case "comment":
        return `${username} commented on your post`;
      case "follow":
        return `${username} started following you`;
      default:
        return notif.message_text || "New notification";
    }
  };

  const formatTime = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <motion.div
                className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 border-b border-border ${
                  !notif.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary">
                  {notif.from_profile?.profile_image ? (
                    <img
                      src={notif.from_profile.profile_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getNotificationIcon(notif.type)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{getNotificationText(notif)}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(notif.created_at)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSheet;
