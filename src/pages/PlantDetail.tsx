import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Phone, Send, Bookmark, ShoppingBag, MapPin, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { sendLikeNotification } from "@/lib/notifications";

interface PlantData {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  size: string | null;
  height: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  tags: string[] | null;
  user_id: string;
  created_at: string;
}

interface ProfileData {
  nursery_name: string;
  username: string;
  profile_image: string | null;
  bio: string | null;
  address: string | null;
  phone_number: string | null;
  profile_links: any;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    profile_image: string | null;
  };
}

const PlantDetail = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [plant, setPlant] = useState<PlantData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (plantId) {
      fetchPlant();
      fetchComments();
    }
  }, [plantId]);

  useEffect(() => {
    if (user && plantId) {
      checkUserState();
    }
  }, [user, plantId, plant]);

  const fetchPlant = async () => {
    try {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("id", plantId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate("/home");
        return;
      }

      setPlant(data);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user_id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch like count
      const { count } = await supabase
        .from("plant_likes")
        .select("id", { count: "exact" })
        .eq("plant_id", plantId);
      
      setLikeCount(count || 0);
    } catch (error) {
      console.error("Error fetching plant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!plantId) return;
    
    const { data } = await supabase
      .from("plant_comments")
      .select("*")
      .eq("plant_id", plantId)
      .order("created_at", { ascending: false });

    if (data) {
      const commentsWithProfiles = await Promise.all(
        data.map(async (comment) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, profile_image")
            .eq("user_id", comment.user_id)
            .maybeSingle();
          return { ...comment, profile: profileData };
        })
      );
      setComments(commentsWithProfiles);
    }
  };

  const checkUserState = async () => {
    if (!user || !plantId) return;

    const [likeResult, saveResult, followResult] = await Promise.all([
      supabase.from("plant_likes").select("id").eq("plant_id", plantId).eq("user_id", user.id).maybeSingle(),
      supabase.from("plant_saves").select("id").eq("plant_id", plantId).eq("user_id", user.id).maybeSingle(),
      plant ? supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", plant.user_id).maybeSingle() : null,
    ]);

    setIsLiked(!!likeResult?.data);
    setIsSaved(!!saveResult?.data);
    if (followResult) setIsFollowing(!!followResult.data);
  };

  const handleLike = async () => {
    if (!user || !plant) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }

    try {
      if (isLiked) {
        await supabase.from("plant_likes").delete().eq("plant_id", plantId).eq("user_id", user.id);
        setLikeCount(likeCount - 1);
      } else {
        await supabase.from("plant_likes").insert({ plant_id: plantId, user_id: user.id });
        if (plant.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: plant.user_id,
            type: "like",
            from_user_id: user.id,
          });
          const { data: myProfile } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
          if (myProfile) sendLikeNotification(myProfile.username);
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
      toast({ title: "Please sign in", variant: "destructive" });
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
    if (!user || !plant) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }

    if (plant.user_id === user.id) return;

    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", plant.user_id);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: plant.user_id });
        await supabase.from("notifications").insert({
          user_id: plant.user_id,
          type: "follow",
          from_user_id: user.id,
        });
      }
      setIsFollowing(!isFollowing);
      toast({ title: isFollowing ? "Unfollowed" : "Following!" });
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !plantId) {
      toast({ title: "Please sign in and enter a comment", variant: "destructive" });
      return;
    }

    try {
      await supabase.from("plant_comments").insert({
        plant_id: plantId,
        user_id: user.id,
        content: newComment.trim(),
      });
      setNewComment("");
      fetchComments();
      toast({ title: "Comment added!" });
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: plant?.name || "Plant",
      text: plant?.description || "Check out this plant!",
      url,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
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

  // Removed openInMaps - location is now display only

  const handleCall = () => {
    if (profile) {
      const phoneNumber = (profile as any).phone_number;
      if (phoneNumber) {
        window.location.href = `tel:${phoneNumber}`;
      } else {
        toast({ title: "No phone number available", variant: "destructive" });
      }
    }
  };

  const images = plant?.image_urls?.length ? plant.image_urls : plant?.image_url ? [plant.image_url] : [];

  if (isLoading) {
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

  if (!plant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Plant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg text-foreground flex-1">{plant.name}</h1>
      </header>

      {/* Image Carousel */}
      <div className="relative aspect-square bg-secondary">
        <img
          src={images[currentImageIndex] || "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800"}
          alt={plant.name}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentImageIndex ? "bg-primary" : "bg-background/60"}`}
                />
              ))}
            </div>
          </>
        )}
        {plant.price && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-4 py-2 rounded-full text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            ₹{plant.price}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="p-1 active:scale-90 transition-transform">
              <Heart className={`w-7 h-7 ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
            </button>
            <button onClick={() => document.getElementById("comment-input")?.focus()} className="p-1">
              <MessageSquare className="w-7 h-7 text-foreground" />
            </button>
            <button onClick={handleShare} className="p-1">
              <Send className="w-7 h-7 text-foreground" />
            </button>
          </div>
          <button onClick={handleSave} className="p-1 active:scale-90 transition-transform">
            <Bookmark className={`w-7 h-7 ${isSaved ? "fill-foreground text-foreground" : "text-foreground"}`} />
          </button>
        </div>
        <p className="font-semibold mt-2">{likeCount.toLocaleString()} likes</p>
      </div>

      {/* Plant Details */}
      <div className="px-4 py-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{plant.name}</h2>
          {plant.description && <p className="text-muted-foreground mt-1">{plant.description}</p>}
        </div>

        {(plant.size || plant.height) && (
          <div className="flex flex-wrap gap-2">
            {plant.size && (
              <span className="px-3 py-1 bg-secondary rounded-full text-sm">Size: {plant.size}</span>
            )}
            {plant.height && (
              <span className="px-3 py-1 bg-secondary rounded-full text-sm">Height: {plant.height}</span>
            )}
          </div>
        )}

        {plant.tags && plant.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plant.tags.map((tag) => (
              <span key={tag} className="text-sm px-3 py-1 bg-plantx-light text-primary rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Seller Info */}
      {profile && (
        <div className="mx-4 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(`/user/${profile.username}`)} className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
              <img
                src={profile.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150"}
                alt={profile.nursery_name}
                className="w-full h-full object-cover"
              />
            </button>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{profile.nursery_name}</h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
            {user && plant.user_id !== user.id && (
              <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isFollowing ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {profile.bio && <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>}

          {profile.address && (
            <div className="w-full flex items-center gap-2 p-3 bg-secondary rounded-lg mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm flex-1 text-left">{profile.address}</span>
            </div>
          )}

          {user && plant.user_id !== user.id && profile.phone_number && (
            <Button 
              onClick={() => window.location.href = `tel:${profile.phone_number}`} 
              className="w-full" 
              variant="outline"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Seller
            </Button>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="px-4 py-4">
        <h3 className="font-semibold mb-3">Comments ({comments.length})</h3>
        
        {user && (
          <div className="flex gap-2 mb-4">
            <Input
              id="comment-input"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
              className="flex-1"
            />
            <Button onClick={handleAddComment} size="sm">Post</Button>
          </div>
        )}

        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={comment.profile?.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=100"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-semibold">{comment.profile?.username || "Unknown"}</span>{" "}
                  <span className="text-foreground">{comment.content}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PlantDetail;
