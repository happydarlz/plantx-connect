import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Grid3X3, Leaf, MessageCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

interface UserProfileCardProps {
  userId: string;
  username: string;
}

interface ProfileData {
  nursery_name: string;
  username: string;
  bio: string | null;
  profile_image: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_links: { title: string; url: string }[];
}

interface Stats {
  postsCount: number;
  plantsCount: number;
  followers: number;
  following: number;
}

const UserProfileCard = ({ userId, username }: UserProfileCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>({ postsCount: 0, plantsCount: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<{ id: string; image_url: string }[]>([]);
  const [plants, setPlants] = useState<{ id: string; image_url: string | null; name: string }[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "plants">("posts");

  useEffect(() => {
    fetchProfile();
    checkFollowStatus();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
        const links = profileData.profile_links;
        let parsedLinks: { title: string; url: string }[] = [];
        if (Array.isArray(links)) {
          parsedLinks = links as { title: string; url: string }[];
        }
        setProfile({
          nursery_name: profileData.nursery_name,
          username: profileData.username,
          bio: profileData.bio,
          profile_image: profileData.profile_image,
          address: profileData.address,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          profile_links: parsedLinks,
        });
      }

      const { data: postsData, count: postsCount } = await supabase
        .from("posts")
        .select("id, image_url", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);

      const { data: plantsData, count: plantsCount } = await supabase
        .from("plants")
        .select("id, image_url, name", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPlants(plantsData || []);

      const { count: followersCount } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("following_id", userId);

      const { count: followingCount } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("follower_id", userId);

      setStats({
        postsCount: postsCount || 0,
        plantsCount: plantsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) {
      toast({ title: "Please sign in to follow", variant: "destructive" });
      return;
    }

    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "follow",
          from_user_id: user.id,
        });
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleMessage = async () => {
    if (!user) {
      toast({ title: "Please sign in to message", variant: "destructive" });
      return;
    }

    if (isStartingChat) return;
    setIsStartingChat(true);

    try {
      // Check if chat already exists
      const { data: myChats } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (myChats && myChats.length > 0) {
        for (const chat of myChats) {
          const { data: otherUser } = await supabase
            .from("chat_participants")
            .select("user_id")
            .eq("chat_id", chat.chat_id)
            .eq("user_id", userId)
            .maybeSingle();

          if (otherUser) {
            navigate("/chat");
            return;
          }
        }
      }

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({})
        .select("id")
        .single();

      if (chatError) throw chatError;

      // Add both participants
      const { error: p1Error } = await supabase
        .from("chat_participants")
        .insert({ chat_id: newChat.id, user_id: user.id });

      if (p1Error) throw p1Error;

      const { error: p2Error } = await supabase
        .from("chat_participants")
        .insert({ chat_id: newChat.id, user_id: userId });

      if (p2Error) throw p2Error;

      toast({ title: "Chat started!" });
      navigate("/chat");
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({ 
        title: "Could not start chat", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  const openInGoogleMaps = () => {
    if (profile?.latitude && profile?.longitude) {
      const url = `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`;
      window.open(url, "_blank");
    } else if (profile?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`;
      window.open(url, "_blank");
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground text-center">@{profile.username}</h1>
      </header>

      {/* Profile Info */}
      <section className="px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-background p-0.5 story-ring">
            <img
              src={profile.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=200&h=200&fit=crop"}
              alt={profile.nursery_name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-semibold text-foreground">{stats.postsCount}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{stats.followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{stats.following}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="font-semibold text-foreground">{profile.nursery_name}</h2>
          {profile.bio && <p className="text-sm text-foreground mt-1">{profile.bio}</p>}
          
          {/* Location with Google Maps Link */}
          {(profile.address || (profile.latitude && profile.longitude)) && (
            <button
              onClick={openInGoogleMaps}
              className="flex items-center gap-1.5 text-sm text-primary mt-2 hover:underline"
            >
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[250px]">{profile.address || "View Location"}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Profile Links */}
          {profile.profile_links && profile.profile_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.profile_links.map((link, index) => (
                <a
                  key={index}
                  href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded-full"
                >
                  <LinkIcon className="w-3 h-3" />
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {user && user.id !== userId && (
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleFollow}
              variant={isFollowing ? "outline" : "default"}
              className="flex-1 h-10 rounded-xl"
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button onClick={handleMessage} variant="outline" className="flex-1 h-10 rounded-xl" disabled={isStartingChat}>
              {isStartingChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" /> Message
                </>
              )}
            </Button>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="border-t border-border flex">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 flex justify-center ${
            activeTab === "posts" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <Grid3X3 className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab("plants")}
          className={`flex-1 py-3 flex justify-center ${
            activeTab === "plants" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <Leaf className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      {activeTab === "posts" ? (
        posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square bg-secondary">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )
      ) : plants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No plants listed</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {plants.map((plant) => (
            <div key={plant.id} className="aspect-square bg-secondary">
              {plant.image_url ? (
                <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default UserProfileCard;
