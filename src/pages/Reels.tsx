import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
}

const Reels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReels();
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

  const currentReel = reels[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Reels Yet</h2>
          <p className="text-muted-foreground">Be the first to create a reel!</p>
        </motion.div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Reels Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
          {/* Video/Image placeholder */}
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

          {/* Play/Pause indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white" />
              </div>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

          {/* User info */}
          <div className="absolute bottom-24 left-4 right-16">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <img
                  src={currentReel.profiles?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=100"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-semibold">@{currentReel.profiles?.username}</span>
              <button className="px-4 py-1 border border-white rounded-full text-white text-sm">
                Follow
              </button>
            </div>
            <p className="text-white text-sm">{currentReel.caption}</p>
          </div>

          {/* Side actions */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
            <button className="flex flex-col items-center">
              <Heart className="w-8 h-8 text-white" />
              <span className="text-white text-xs mt-1">{currentReel.likes_count}</span>
            </button>
            <button className="flex flex-col items-center">
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="text-white text-xs mt-1">0</span>
            </button>
            <button className="flex flex-col items-center">
              <Share2 className="w-8 h-8 text-white" />
            </button>
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? (
                <VolumeX className="w-8 h-8 text-white" />
              ) : (
                <Volume2 className="w-8 h-8 text-white" />
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicators */}
      <div className="absolute top-4 left-4 right-4 flex gap-1">
        {reels.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index === currentIndex ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Reels;
