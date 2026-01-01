import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Leaf, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import PlantXLogo from "@/components/PlantXLogo";
import StoryCircle from "@/components/StoryCircle";
import StoryViewer from "@/components/StoryViewer";
import PostCard from "@/components/PostCard";
import PlantFeedCard from "@/components/PlantFeedCard";
import BottomNav from "@/components/BottomNav";
import NotificationsSheet from "@/components/NotificationsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  type: 'post';
}

interface Plant {
  id: string;
  user_id: string;
  image_url: string | null;
  name: string;
  description: string | null;
  price: number | null;
  size: string | null;
  height: string | null;
  tags: string[];
  created_at: string;
  profiles: {
    nursery_name: string;
    username: string;
    profile_image: string | null;
  } | null;
  type: 'plant';
}

interface Story {
  id: string;
  name: string;
  image: string;
  userId: string;
  isOwn?: boolean;
  hasStory?: boolean;
}

type FeedItem = Post | Plant;

const Home = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Story viewer state
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchFeed(), fetchStories(), fetchUnreadCount()]);
    setIsRefreshing(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || containerRef.current?.scrollTop !== 0) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, Math.min(currentY - startY.current, 150));
    setPullDistance(distance);
  };

  const handleTouchEnd = () => {
    if (pullDistance >= threshold && !isRefreshing) {
      handleRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchFeed();
    fetchStories();
    fetchUnreadCount();

    const postChannel = supabase
      .channel('home-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchFeed())
      .subscribe();

    const plantChannel = supabase
      .channel('home-plants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, () => fetchFeed())
      .subscribe();

    const notifChannel = supabase
      .channel('home-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchUnreadCount())
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(plantChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user, navigate]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const fetchFeed = async () => {
    try {
      // Fetch posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch plants
      const { data: plantsData } = await supabase
        .from("plants")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Get counts and profiles for posts
      const postsWithData = await Promise.all(
        (postsData || []).map(async (post) => {
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
            type: 'post' as const,
          };
        })
      );

      // Get profiles for plants
      const plantsWithData = await Promise.all(
        (plantsData || []).map(async (plant) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("nursery_name, username, profile_image")
            .eq("user_id", plant.user_id)
            .maybeSingle();

          return {
            ...plant,
            profiles: profileData,
            type: 'plant' as const,
          };
        })
      );

      // Combine and sort by created_at
      const combined = [...postsWithData, ...plantsWithData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFeedItems(combined);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStories = async () => {
    const { data: storiesData } = await supabase
      .from("stories")
      .select("id, user_id, image_url")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    const userStories = new Map();
    
    // Check if current user has stories
    const hasOwnStory = storiesData?.some(s => s.user_id === user?.id);
    
    for (const story of storiesData || []) {
      if (!userStories.has(story.user_id) && story.user_id !== user?.id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nursery_name, profile_image")
          .eq("user_id", story.user_id)
          .maybeSingle();
          
        userStories.set(story.user_id, {
          id: story.user_id,
          userId: story.user_id,
          name: profileData?.nursery_name || "Unknown",
          image: profileData?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop",
          hasStory: true,
        });
      }
    }

    const ownStory: Story = {
      id: "own",
      userId: user?.id || "",
      name: "Your Story",
      image: profile?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop",
      isOwn: true,
      hasStory: hasOwnStory,
    };

    setStories([ownStory, ...Array.from(userStories.values())]);
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setStoryViewerOpen(true);
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

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background pb-20 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{ height: pullDistance > 0 ? pullDistance : isRefreshing ? 60 : 0 }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : pullDistance * 2 }}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw className={`w-6 h-6 ${pullDistance >= threshold || isRefreshing ? 'text-primary' : 'text-muted-foreground'}`} />
        </motion.div>
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <PlantXLogo size="sm" />
          <button 
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <Bell className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Stories */}
      <section className="border-b border-border">
        <div className="flex gap-3 px-4 py-4 overflow-x-auto hide-scrollbar">
          {stories.map((story, index) => (
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
                onClick={() => handleStoryClick(story)}
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
        ) : feedItems.length > 0 ? (
          feedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {item.type === 'post' ? (
                <PostCard
                  postId={item.id}
                  userId={item.user_id}
                  nurseryName={item.profiles?.nursery_name || "Unknown Nursery"}
                  username={item.profiles?.username || "unknown"}
                  nurseryImage={item.profiles?.profile_image || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop"}
                  postImage={item.image_url}
                  caption={item.caption || ""}
                  tags={item.tags || []}
                  likes={item.likes_count}
                  comments={item.comments_count}
                  timeAgo={formatTimeAgo(item.created_at)}
                />
              ) : (
                <PlantFeedCard
                  plantId={item.id}
                  userId={item.user_id}
                  nurseryName={item.profiles?.nursery_name || "Unknown Nursery"}
                  username={item.profiles?.username || "unknown"}
                  nurseryImage={item.profiles?.profile_image || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop"}
                  plantImage={item.image_url || "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800"}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  size={item.size}
                  height={item.height}
                  tags={item.tags || []}
                  timeAgo={formatTimeAgo(item.created_at)}
                />
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No posts yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share!</p>
          </div>
        )}
      </section>

      <NotificationsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      
      {/* Story Viewer */}
      {selectedStory && (
        <StoryViewer
          open={storyViewerOpen}
          onClose={() => {
            setStoryViewerOpen(false);
            setSelectedStory(null);
          }}
          userId={selectedStory.userId}
          userName={selectedStory.name}
          userImage={selectedStory.image}
          isOwn={selectedStory.isOwn}
        />
      )}
      
      <BottomNav />
    </div>
  );
};

export default Home;
