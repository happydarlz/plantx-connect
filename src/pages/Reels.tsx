import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Bookmark } from "lucide-react";
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

const ReelItem = ({
  reel,
  isActive,
  isMuted,
  likedReels,
  savedReels,
  user,
  profile,
  onLike,
  onSave,
  onShare,
  onFollow,
  onToggleMute,
  onOpenComments,
  onGoToProfile,
}: {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  likedReels: Set<string>;
  savedReels: Set<string>;
  user: any;
  profile: any;
  onLike: (reel: Reel) => void;
  onSave: (reel: Reel) => void;
  onShare: (reel: Reel) => void;
  onFollow: (reel: Reel) => void;
  onToggleMute: () => void;
  onOpenComments: () => void;
  onGoToProfile: (username: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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

  return (
    <div className="h-screen w-full flex-shrink-0 relative snap-start snap-always">
      <div className="absolute inset-0" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={reel.video_url}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="auto"
        />

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (reel.profiles?.username) onGoToProfile(reel.profiles.username);
            }}
            className="flex items-center gap-3 mb-3"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
              <img
                src={reel.profiles?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=100"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-semibold">@{reel.profiles?.username}</span>
          </button>
          {user && reel.user_id !== user.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFollow(reel);
              }}
              className="px-4 py-1.5 border border-white rounded-full text-white text-sm mb-3"
            >
              Follow
            </button>
          )}
          <p className="text-white text-sm">{reel.caption}</p>
        </div>

        {/* Side actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(reel);
            }}
            className="flex flex-col items-center active:scale-90 transition-transform"
          >
            <Heart
              className={`w-8 h-8 ${likedReels.has(reel.id) ? "fill-red-500 text-red-500" : "text-white"}`}
            />
            <span className="text-white text-xs mt-1">{reel.likes_count}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments();
            }}
            className="flex flex-col items-center"
          >
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="text-white text-xs mt-1">0</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(reel);
            }}
            className="flex flex-col items-center"
          >
            <Share2 className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(reel);
            }}
            className="flex flex-col items-center"
          >
            <Bookmark
              className={`w-8 h-8 ${savedReels.has(reel.id) ? "fill-white text-white" : "text-white"}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          >
            {isMuted ? <VolumeX className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const Reels = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReels();
    fetchLikedReels();
    fetchSavedReels();
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

  const fetchSavedReels = async () => {
    if (!user) return;
    const { data } = await supabase.from("reel_saves").select("reel_id").eq("user_id", user.id);
    setSavedReels(new Set(data?.map((s) => s.reel_id) || []));
  };

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const height = window.innerHeight;
      const newIndex = Math.round(scrollTop / height);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex, reels.length]);

  const handleSave = async (reel: Reel) => {
    if (!user) return;

    const isSaved = savedReels.has(reel.id);
    try {
      if (isSaved) {
        await supabase.from("reel_saves").delete().eq("reel_id", reel.id).eq("user_id", user.id);
        setSavedReels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reel.id);
          return newSet;
        });
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("reel_saves").insert({ reel_id: reel.id, user_id: user.id });
        setSavedReels((prev) => new Set(prev).add(reel.id));
        toast({ title: "Reel saved!" });
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleLike = async (reel: Reel) => {
    if (!user) return;

    const isLiked = likedReels.has(reel.id);
    try {
      if (isLiked) {
        await supabase.from("reel_likes").delete().eq("reel_id", reel.id).eq("user_id", user.id);
        setLikedReels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reel.id);
          return newSet;
        });
        setReels((prev) =>
          prev.map((r) => (r.id === reel.id ? { ...r, likes_count: r.likes_count - 1 } : r))
        );
      } else {
        await supabase.from("reel_likes").insert({ reel_id: reel.id, user_id: user.id });
        setLikedReels((prev) => new Set(prev).add(reel.id));
        setReels((prev) =>
          prev.map((r) => (r.id === reel.id ? { ...r, likes_count: r.likes_count + 1 } : r))
        );

        if (reel.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: reel.user_id,
            type: "like",
            from_user_id: user.id,
          });
          if (profile) sendLikeNotification(profile.username, "reel");
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleShare = async (reel: Reel) => {
    const url = `${window.location.origin}/user/${reel.profiles?.username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Reel by ${reel.profiles?.nursery_name}`,
          text: reel.caption || "Check out this reel!",
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

  const handleFollow = async (reel: Reel) => {
    if (!user || reel.user_id === user.id) return;
    try {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: reel.user_id });
      await supabase.from("notifications").insert({
        user_id: reel.user_id,
        type: "follow",
        from_user_id: user.id,
      });
      if (profile) sendFollowNotification(profile.username);
      toast({ title: "Following!" });
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const goToProfile = (username: string) => {
    navigate(`/user/${username}`);
  };

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
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Progress indicators */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
        {reels.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Scrollable reels container */}
      <div
        ref={containerRef}
        className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollSnapType: "y mandatory" }}
      >
        {reels.map((reel, index) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            isMuted={isMuted}
            likedReels={likedReels}
            savedReels={savedReels}
            user={user}
            profile={profile}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onFollow={handleFollow}
            onToggleMute={() => setIsMuted(!isMuted)}
            onOpenComments={() => setCommentsOpen(true)}
            onGoToProfile={goToProfile}
          />
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
