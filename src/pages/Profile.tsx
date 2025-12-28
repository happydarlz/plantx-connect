import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Share2, MapPin, Grid3X3, Leaf, Film, Bookmark, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import EditProfileSheet from "@/components/EditProfileSheet";
import SettingsSheet from "@/components/SettingsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { id: "posts", icon: Grid3X3, label: "Posts" },
  { id: "plants", icon: Leaf, label: "Plants" },
  { id: "reels", icon: Film, label: "Reels" },
  { id: "saved", icon: Bookmark, label: "Saved" },
];

interface Stats {
  postsCount: number;
  followers: number;
  following: number;
}

interface Post {
  id: string;
  image_url: string;
}

interface Plant {
  id: string;
  image_url: string | null;
  name: string;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const Profile = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  const [stats, setStats] = useState<Stats>({ postsCount: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: postsData, count: postsCount } = await supabase
        .from("posts")
        .select("id, image_url", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);

      const { data: plantsData } = await supabase
        .from("plants")
        .select("id, image_url, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPlants(plantsData || []);

      const { count: followersCount } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("following_id", user.id);

      const { count: followingCount } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("follower_id", user.id);

      setStats({
        postsCount: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/user/${profile?.username}`;
    try {
      await navigator.share({
        title: `${profile?.nursery_name} on PlantX`,
        url,
      });
    } catch {
      await navigator.clipboard.writeText(url);
      toast({ title: "Profile link copied!", description: url });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <motion.div
            className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      );
    }

    if (activeTab === "posts") {
      if (posts.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post, index) => (
            <motion.button
              key={post.id}
              className="aspect-square bg-secondary relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>
      );
    }

    if (activeTab === "plants") {
      if (plants.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No plants listed yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {plants.map((plant, index) => (
            <motion.button
              key={plant.id}
              className="aspect-square bg-secondary relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {plant.image_url ? (
                <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Coming soon!</p>
      </div>
    );
  };

  // Get profile links
  const profileLinks = (() => {
    try {
      const links = (profile as any)?.profile_links;
      if (Array.isArray(links)) return links;
      return [];
    } catch {
      return [];
    }
  })();

  if (!profile) {
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
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShareProfile}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Profile Info */}
      <section className="px-4 py-6">
        <div className="flex items-start gap-4">
          <motion.div
            className="story-ring rounded-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-background p-0.5">
              <img
                src={profile.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=200&h=200&fit=crop"}
                alt={profile.nursery_name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </motion.div>

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-semibold text-foreground">{stats.postsCount}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{formatNumber(stats.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{formatNumber(stats.following)}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-4">
          <h2 className="font-semibold text-foreground">{profile.nursery_name}</h2>
          {profile.bio && <p className="text-sm text-foreground mt-1">{profile.bio}</p>}
          {profile.address && (
            <button className="flex items-center gap-1 text-sm text-primary mt-2">
              <MapPin className="w-4 h-4" />
              {profile.address}
            </button>
          )}
          
          {/* Profile Links */}
          {profileLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profileLinks.map((link: { title: string; url: string }, index: number) => (
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
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            className="flex-1 h-10 rounded-xl border-border"
            onClick={() => setEditProfileOpen(true)}
          >
            Edit Profile
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-10 rounded-xl border-border"
            onClick={handleShareProfile}
          >
            Share Profile
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-t border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex justify-center transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      <EditProfileSheet open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <BottomNav />
    </div>
  );
};

export default Profile;
