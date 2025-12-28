import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import PlantXLogo from "@/components/PlantXLogo";
import StoryCircle from "@/components/StoryCircle";
import PostCard from "@/components/PostCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  tags: string[];
  created_at: string;
  profiles: {
    nursery_name: string;
    username: string;
    profile_image: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
}

interface Story {
  id: string;
  name: string;
  image: string;
  isOwn?: boolean;
  hasStory?: boolean;
}

const Home = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchPosts();
    fetchStories();
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get profile data and counts for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [likesResult, commentsResult, profileResult] = await Promise.all([
            supabase.from("post_likes").select("id", { count: "exact" }).eq("post_id", post.id),
            supabase.from("comments").select("id", { count: "exact" }).eq("post_id", post.id),
            supabase.from("profiles").select("nursery_name, username, profile_image").eq("user_id", post.user_id).maybeSingle(),
          ]);

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            profiles: profileResult.data,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStories = async () => {
    // Fetch recent stories
    const { data: storiesData } = await supabase
      .from("stories")
      .select("id, user_id, image_url")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Group by user and get unique users with profiles
    const userStories = new Map();
    
    for (const story of storiesData || []) {
      if (!userStories.has(story.user_id)) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nursery_name, profile_image")
          .eq("user_id", story.user_id)
          .maybeSingle();
          
        userStories.set(story.user_id, {
          id: story.user_id,
          name: profileData?.nursery_name || "Unknown",
          image: profileData?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop",
          hasStory: true,
        });
      }
    });

    // Add own story first
    const ownStory: Story = {
      id: "own",
      name: "Your Story",
      image: profile?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop",
      isOwn: true,
      hasStory: false,
    };

    setStories([ownStory, ...Array.from(userStories.values())]);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "See you next time! 🌱",
    });
    navigate("/auth");
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Mock stories if none exist
  const displayStories = stories.length > 1 ? stories : [
    { id: "own", name: "Your Story", image: profile?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop", isOwn: true, hasStory: false },
    { id: "1", name: "Green Haven", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop", hasStory: true },
    { id: "2", name: "Plant Paradise", image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=150&h=150&fit=crop", hasStory: true },
    { id: "3", name: "Urban Garden", image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=150&h=150&fit=crop", hasStory: true },
  ];

  // Mock posts if none exist
  const displayPosts = posts.length > 0 ? posts : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <PlantXLogo size="sm" />
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-secondary rounded-full transition-colors">
              <Bell className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <section className="border-b border-border">
        <div className="flex gap-3 px-4 py-4 overflow-x-auto hide-scrollbar">
          {displayStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <StoryCircle
                name={story.name}
                image={story.image}
                isOwn={story.isOwn}
                hasStory={story.hasStory}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : displayPosts.length > 0 ? (
          displayPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard
                nurseryName={post.profiles?.nursery_name || "Unknown Nursery"}
                username={post.profiles?.username || "unknown"}
                nurseryImage={post.profiles?.profile_image || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop"}
                postImage={post.image_url}
                caption={post.caption || ""}
                tags={post.tags || []}
                likes={post.likes_count}
                comments={post.comments_count}
                timeAgo={formatTimeAgo(post.created_at)}
              />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share!</p>
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
};

export default Home;
