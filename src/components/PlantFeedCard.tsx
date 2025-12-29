import { Heart, MessageCircle, Send, Bookmark, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendLikeNotification, sendFollowNotification } from "@/lib/notifications";

interface PlantFeedCardProps {
  plantId: string;
  userId: string;
  nurseryName: string;
  username: string;
  nurseryImage: string;
  plantImage: string;
  name: string;
  description: string | null;
  price: number | null;
  size: string | null;
  height: string | null;
  tags: string[];
  timeAgo: string;
}

const PlantFeedCard = ({
  plantId,
  userId,
  nurseryName,
  username,
  nurseryImage,
  plantImage,
  name,
  description,
  price,
  size,
  height,
  tags,
  timeAgo,
}: PlantFeedCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (user) {
      checkInitialState();
    }
    fetchLikeCount();
  }, [user, plantId]);

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("plant_likes")
      .select("id", { count: "exact" })
      .eq("plant_id", plantId);
    setLikeCount(count || 0);
  };

  const checkInitialState = async () => {
    if (!user) return;
    
    const [likeResult, saveResult, followResult] = await Promise.all([
      supabase.from("plant_likes").select("id").eq("plant_id", plantId).eq("user_id", user.id).maybeSingle(),
      supabase.from("plant_saves").select("id").eq("plant_id", plantId).eq("user_id", user.id).maybeSingle(),
      supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", userId).maybeSingle(),
    ]);
    
    setIsLiked(!!likeResult.data);
    setIsSaved(!!saveResult.data);
    setIsFollowing(!!followResult.data);
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please sign in to like", variant: "destructive" });
      return;
    }

    try {
      if (isLiked) {
        await supabase.from("plant_likes").delete().eq("plant_id", plantId).eq("user_id", user.id);
        setLikeCount(likeCount - 1);
      } else {
        await supabase.from("plant_likes").insert({ plant_id: plantId, user_id: user.id });
        if (userId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "like",
            from_user_id: user.id,
          });
          const { data: profile } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
          if (profile) sendLikeNotification(profile.username);
        }
        setLikeCount(likeCount + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Please sign in to save", variant: "destructive" });
      return;
    }

    try {
      if (isSaved) {
        await supabase.from("plant_saves").delete().eq("plant_id", plantId).eq("user_id", user.id);
      } else {
        await supabase.from("plant_saves").insert({ plant_id: plantId, user_id: user.id });
      }
      setIsSaved(!isSaved);
      toast({ title: isSaved ? "Removed from saved" : "Saved!" });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({ title: "Please sign in to follow", variant: "destructive" });
      return;
    }

    if (userId === user.id) return;

    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "follow",
          from_user_id: user.id,
        });
        const { data: profile } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
        if (profile) sendFollowNotification(profile.username);
      }
      setIsFollowing(!isFollowing);
      toast({ title: isFollowing ? "Unfollowed" : "Following!" });
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/plant/${plantId}`;
    const shareData = { 
      title: name, 
      text: description || `Check out ${name} from ${nurseryName}`,
      url 
    };
    
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard!" });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!" });
      }
    }
  };

  const goToProfile = () => {
    navigate(`/user/${username}`);
  };

  const goToPlant = () => {
    navigate(`/plant/${plantId}`);
  };

  return (
    <article className="bg-card rounded-xl plantx-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <button onClick={goToProfile} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={nurseryImage} alt={nurseryName} className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm text-foreground">{nurseryName}</h3>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>
        </button>
        {user && userId !== user.id && (
          <button
            onClick={handleFollow}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              isFollowing ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Image - clickable to open detail */}
      <button onClick={goToPlant} className="relative aspect-square bg-secondary w-full">
        <img src={plantImage} alt={name} className="w-full h-full object-cover" />
        {price && (
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
            <ShoppingBag className="w-4 h-4" />
            ₹{price}
          </div>
        )}
      </button>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="p-1 active:scale-90 transition-transform">
              <Heart
                className={`w-6 h-6 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`}
              />
            </button>
            <button onClick={goToPlant} className="p-1">
              <MessageCircle className="w-6 h-6 text-foreground" />
            </button>
            <button onClick={handleShare} className="p-1">
              <Send className="w-6 h-6 text-foreground" />
            </button>
          </div>
          <button onClick={handleSave} className="p-1 active:scale-90 transition-transform">
            <Bookmark className={`w-6 h-6 transition-colors ${isSaved ? "fill-foreground text-foreground" : "text-foreground"}`} />
          </button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">{likeCount.toLocaleString()} likes</p>

        {/* Name & Description */}
        <p className="text-sm">
          <span className="font-semibold">{name}</span>
          {description && <span className="text-muted-foreground ml-1">{description.slice(0, 100)}{description.length > 100 ? '...' : ''}</span>}
        </p>

        {/* Details */}
        {(size || height) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {size && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                Size: {size}
              </span>
            )}
            {height && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                Height: {height}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-plantx-light text-primary font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Time */}
        <p className="text-[10px] text-muted-foreground mt-2 uppercase">{timeAgo}</p>
      </div>
    </article>
  );
};

export default PlantFeedCard;
