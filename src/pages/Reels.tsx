import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { sendLikeNotification, sendFollowNotification } from "@/lib/notifications";

interface Reel {
  id: string;
  video_url: string;
  caption: string | null;
  user_id: string;
  profiles: {
    username: string;
    nursery_name: string;
    profile_image: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
}

const Reels = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReels();
    fetchLikedReels();
  }, [user, navigate]);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from("reels")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const reelsWithProfiles = await Promise.all(
        (data || []).map(async (reel) => {
          const [profileResult, likesResult] = await Promise.all([
            supabase.from("profiles").select("username, nursery_name, profile_image").eq("user_id", reel.user_id).maybeSingle(),
            supabase.from("reel_likes").select("id", { count: "exact" }).eq("reel_id", reel.id),
          ]);
          return {
            ...reel,
            profiles: profileResult.data,
            likes_count: likesResult.count || 0,
            comments_count: 0,
          };
        })
      );

      setReels(reelsWithProfiles);
    } catch (error) {
      console.error("Error fetching reels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikedReels = async () => {
    if (!user) return;
    const { data } = await supabase.from("reel_likes").select("reel_id").eq("user_id", user.id);
    setLikedReels(new Set(data?.map((l) => l.reel_id) || []));
  };

  const handleScroll = (direction: "up" | "down") => {
    if (direction === "down" && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = async () => {
    if (!user || !currentReel) return;

    const isLiked = likedReels.has(currentReel.id);
    try {
      if (isLiked) {
        await supabase.from("reel_likes").delete().eq("reel_id", currentReel.id).eq("user_id", user.id);
        setLikedReels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(currentReel.id);
          return newSet;
        });
        setReels((prev) =>
          prev.map((r) => (r.id === currentReel.id ? { ...r, likes_count: r.likes_count - 1 } : r))
        );
      } else {
        await supabase.from("reel_likes").insert({ reel_id: currentReel.id, user_id: user.id });
        setLikedReels((prev) => new Set(prev).add(currentReel.id));
        setReels((prev) =>
          prev.map((r) => (r.id === currentReel.id ? { ...r, likes_count: r.likes_count + 1 } : r))
        );

        // Notification
        if (currentReel.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: currentReel.user_id,
            type: "like",
            from_user_id: user.id,
          });
          // Send browser notification
          if (profile) sendLikeNotification(profile.username, "reel");
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleShare = async () => {
    if (!currentReel) return;
    const url = `${window.location.origin}/user/${currentReel.profiles?.username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Reel by ${currentReel.profiles?.nursery_name}`,
          text: currentReel.caption || "Check out this reel!",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!" });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!" });
      }
    }
  };

  const handleFollow = async () => {
    if (!user || !currentReel || currentReel.user_id === user.id) return;
    try {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: currentReel.user_id });
      await supabase.from("notifications").insert({
        user_id: currentReel.user_id,
        type: "follow",
        from_user_id: user.id,
      });
      // Send browser notification
      if (profile) sendFollowNotification(profile.username);
      toast({ title: "Following!" });
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const goToProfile = () => {
    if (currentReel?.profiles?.username) {
      navigate(`/user/${currentReel.profiles.username}`);
    }
  };

  const currentReel = reels[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Reels Yet</h2>
          <p className="text-muted-foreground">Be the first to create a reel!</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className="absolute inset-0"
        onClick={togglePlay}
        onTouchStart={(e) => {
          const startY = e.touches[0].clientY;
          const handleTouchEnd = (endEvent: TouchEvent) => {
            const endY = endEvent.changedTouches[0].clientY;
            const diff = startY - endY;
            if (diff > 50) handleScroll("down");
            else if (diff < -50) handleScroll("up");
            document.removeEventListener("touchend", handleTouchEnd);
          };
          document.addEventListener("touchend", handleTouchEnd);
        }}
      >
        <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={currentReel.video_url}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            autoPlay
            playsInline
          />
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        {/* User info */}
        <div className="absolute bottom-24 left-4 right-16">
          <button onClick={goToProfile} className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
              <img
                src={currentReel.profiles?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=100"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-semibold">@{currentReel.profiles?.username}</span>
          </button>
          {user && currentReel.user_id !== user.id && (
            <button
              onClick={handleFollow}
              className="px-4 py-1.5 border border-white rounded-full text-white text-sm mb-3"
            >
              Follow
            </button>
          )}
          <p className="text-white text-sm">{currentReel.caption}</p>
        </div>

        {/* Side actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex flex-col items-center active:scale-90 transition-transform"
          >
            <Heart
              className={`w-8 h-8 ${likedReels.has(currentReel.id) ? "fill-red-500 text-red-500" : "text-white"}`}
            />
            <span className="text-white text-xs mt-1">{currentReel.likes_count}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCommentsOpen(true);
            }}
            className="flex flex-col items-center"
          >
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="text-white text-xs mt-1">0</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex flex-col items-center"
          >
            <Share2 className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
          >
            {isMuted ? <VolumeX className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {reels.map((_, index) => (
          <div key={index} className={`h-1 flex-1 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/30"}`} />
        ))}
      </div>

      {/* Comments Sheet */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl px-0">
          <SheetHeader className="px-4 pb-3 border-b border-border">
            <SheetTitle className="text-center">Comments</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(60vh-60px)]">
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Comments coming soon!</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Reels;
