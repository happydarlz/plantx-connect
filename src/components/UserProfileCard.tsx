import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Grid3X3, Leaf, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
      // Fetch profile
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
          profile_links: parsedLinks,
        });
      }

      // Fetch posts
      const { data: postsData, count: postsCount } = await supabase
        .from("posts")
        .select("id, image_url", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);

      // Fetch plants
      const { data: plantsData, count: plantsCount } = await supabase
        .from("plants")
        .select("id, image_url, name", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPlants(plantsData || []);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("following_id", userId);

      // Fetch following count
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
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: userId,
        });
        
        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "follow",
          from_user_id: user.id,
        });
        
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        <h1 className="text-lg font-semibold text-foreground text-center">{profile.username}</h1>
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
          {profile.address && (
            <div className="flex items-center gap-1 text-sm text-primary mt-2">
              <MapPin className="w-4 h-4" />
              {profile.address}
            </div>
          )}
          
          {/* Profile Links */}
          {profile.profile_links && profile.profile_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.profile_links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
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
            <Button variant="outline" className="flex-1 h-10 rounded-xl">
              <MessageCircle className="w-4 h-4 mr-2" /> Message
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
      ) : (
        plants.length === 0 ? (
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
        )
      )}

      <BottomNav />
    </div>
  );
};

export default UserProfileCard;
