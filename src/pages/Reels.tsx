import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Bookmark, RefreshCw, Send, Trash2, MoreVertical } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { sendLikeNotification, sendFollowNotification } from "@/lib/notifications";
import { motion, AnimatePresence } from "framer-motion";

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

interface ReelComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    username: string;
    profile_image: string | null;
  };
}

const ReelItem = ({
  reel,
  isActive,
  isMuted,
  likedReels,
  savedReels,
  user,
  onLike,
  onDoubleTapLike,
  onSave,
  onShare,
  onFollow,
  onToggleMute,
  onOpenComments,
  onGoToProfile,
  commentsCount,
}: {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  likedReels: Set<string>;
  savedReels: Set<string>;
  user: any;
  onLike: (reel: Reel) => void;
  onDoubleTapLike: (reel: Reel) => void;
  onSave: (reel: Reel) => void;
  onShare: (reel: Reel) => void;
  onFollow: (reel: Reel) => void;
  onToggleMute: () => void;
  onOpenComments: () => void;
  onGoToProfile: (username: string) => void;
  commentsCount: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const lastTapRef = useRef(0);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap - like
      onDoubleTapLike(reel);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
      lastTapRef.current = 0;
    } else {
      // Single tap - toggle play
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          if (videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause();
              setIsPlaying(false);
            } else {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }
        }
      }, 300);
    }
  };

  return (
    <div className="h-screen w-full flex-shrink-0 relative snap-start snap-always bg-black">
      <div className="absolute inset-0" onClick={handleTap}>
        <video
          ref={videoRef}
          src={reel.video_url}
          className="w-full h-full object-contain bg-black"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          poster=""
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Double tap like animation */}
        <AnimatePresence>
          {showLikeAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-32 h-32 text-white fill-red-500" />
            </motion.div>
          )}
        </AnimatePresence>

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
            <span className="text-white text-xs mt-1">{commentsCount}</span>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReels();
    fetchLikedReels();
    fetchSavedReels();
  }, [user, navigate]);

  const fetchReels = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("reels")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const reelsWithProfiles = await Promise.all(
        (data || []).map(async (reel) => {
          const [profileResult, likesResult, commentsResult] = await Promise.all([
            supabase.from("profiles").select("username, nursery_name, profile_image").eq("user_id", reel.user_id).maybeSingle(),
            supabase.from("reel_likes").select("id", { count: "exact" }).eq("reel_id", reel.id),
            supabase.from("reel_comments").select("id", { count: "exact" }).eq("reel_id", reel.id),
          ]);
          
          setCommentsCounts(prev => ({ ...prev, [reel.id]: commentsResult.count || 0 }));
          
          return {
            ...reel,
            profiles: profileResult.data,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
          };
        })
      );

      setReels(reelsWithProfiles);
      if (showRefresh) {
        setCurrentIndex(0);
        toast({ title: "Reels refreshed!" });
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const fetchComments = async (reelId: string) => {
    const { data, error } = await supabase
      .from("reel_comments")
      .select("*")
      .eq("reel_id", reelId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    const commentsWithProfiles = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, profile_image")
          .eq("user_id", comment.user_id)
          .maybeSingle();
        return { ...comment, profile: profileData };
      })
    );

    setComments(commentsWithProfiles);
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim() || !reels[currentIndex]) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("reel_comments").insert({
        reel_id: reels[currentIndex].id,
        user_id: user.id,
        content: commentText.trim(),
      });

      if (error) throw error;

      setCommentText("");
      fetchComments(reels[currentIndex].id);
      setCommentsCounts(prev => ({ ...prev, [reels[currentIndex].id]: (prev[reels[currentIndex].id] || 0) + 1 }));
      toast({ title: "Comment added!" });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ title: "Failed to add comment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from("reel_comments").delete().eq("id", commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCounts(prev => ({ ...prev, [reels[currentIndex].id]: Math.max(0, (prev[reels[currentIndex].id] || 0) - 1) }));
      toast({ title: "Comment deleted" });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      if (diff > 0 && diff < 150) {
        setPullDistance(diff);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80 && !isRefreshing) {
      fetchReels(true);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  };

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

  const handleDoubleTapLike = async (reel: Reel) => {
    if (!user || likedReels.has(reel.id)) return;
    
    try {
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

  const openComments = () => {
    if (reels[currentIndex]) {
      fetchComments(reels[currentIndex].id);
      setCommentsOpen(true);
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
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-30 transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
        >
          <div className={`bg-white/20 rounded-full p-2 ${pullDistance > 80 ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {isRefreshing && (
        <div className="absolute top-4 left-0 right-0 flex items-center justify-center z-30">
          <div className="bg-white/20 rounded-full p-2 animate-spin">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
            onLike={handleLike}
            onDoubleTapLike={handleDoubleTapLike}
            onSave={handleSave}
            onShare={handleShare}
            onFollow={handleFollow}
            onToggleMute={() => setIsMuted(!isMuted)}
            onOpenComments={openComments}
            onGoToProfile={goToProfile}
            commentsCount={commentsCounts[reel.id] || 0}
          />
        ))}
      </div>

      {/* Comments Sheet */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl px-0">
          <SheetHeader className="px-4 pb-3 border-b border-border">
            <SheetTitle className="text-center">Comments</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(70vh-120px)]">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {comments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={comment.profile?.profile_image || ""} />
                      <AvatarFallback>{comment.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.profile?.username}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                    {user?.id === comment.user_id && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-full"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Comment input */}
            <div className="border-t border-border px-4 py-3 flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.profile_image || ""} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                className="flex-1 border-0 bg-secondary rounded-full"
              />
              <Button
                size="icon"
                onClick={handleAddComment}
                disabled={!commentText.trim() || isSubmitting}
                className="rounded-full w-9 h-9"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Reels;