import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommentsSheet from "./CommentsSheet";

interface PostCardProps {
  postId: string;
  userId: string;
  nurseryName: string;
  username: string;
  nurseryImage: string;
  postImage: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  timeAgo: string;
}

const PostCard = ({
  postId,
  userId,
  nurseryName,
  username,
  nurseryImage,
  postImage,
  caption,
  tags,
  likes,
  comments,
  timeAgo,
}: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(comments);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkInitialState();
    }
  }, [user, postId]);

  const checkInitialState = async () => {
    if (!user) return;
    
    const [likeResult, saveResult, followResult] = await Promise.all([
      supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
      supabase.from("post_saves").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
      supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", userId).maybeSingle(),
    ]);
    
    setIsLiked(!!likeResult.data);
    setIsSaved(!!saveResult.data);
    setIsFollowing(!!followResult.data);
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please sign in to like posts", variant: "destructive" });
      return;
    }

    try {
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
        setLikeCount(likeCount - 1);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        if (userId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "like",
            from_user_id: user.id,
            post_id: postId,
          });
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
      toast({ title: "Please sign in to save posts", variant: "destructive" });
      return;
    }

    try {
      if (isSaved) {
        await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("post_saves").insert({ post_id: postId, user_id: user.id });
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
      }
      setIsFollowing(!isFollowing);
      toast({ title: isFollowing ? "Unfollowed" : "Following!" });
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${username}`;
    const shareData = { 
      title: `Post by ${nurseryName}`, 
      text: caption || `Check out this post by ${nurseryName}`,
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

  return (
    <>
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
          <div className="flex items-center gap-1">
            {user && userId !== user.id && (
              <motion.button
                onClick={handleFollow}
                whileTap={{ scale: 0.9 }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isFollowing ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </motion.button>
            )}
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-secondary">
          <img src={postImage} alt="Post" className="w-full h-full object-cover" />
        </div>

        {/* Actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <motion.button onClick={handleLike} whileTap={{ scale: 0.8 }} className="p-1">
                <Heart
                  className={`w-6 h-6 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`}
                />
              </motion.button>
              <button onClick={() => setCommentsOpen(true)} className="p-1">
                <MessageCircle className="w-6 h-6 text-foreground" />
              </button>
              <button onClick={handleShare} className="p-1">
                <Send className="w-6 h-6 text-foreground" />
              </button>
            </div>
            <motion.button onClick={handleSave} whileTap={{ scale: 0.8 }} className="p-1">
              <Bookmark className={`w-6 h-6 transition-colors ${isSaved ? "fill-foreground text-foreground" : "text-foreground"}`} />
            </motion.button>
          </div>

          {/* Likes */}
          <p className="font-semibold text-sm mb-1">{likeCount.toLocaleString()} likes</p>

          {/* Caption */}
          <p className="text-sm">
            <span className="font-semibold">{username}</span> <span className="text-foreground">{caption}</span>
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-plantx-light text-primary font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Comments */}
          <button onClick={() => setCommentsOpen(true)} className="text-sm text-muted-foreground mt-2">
            View all {commentCount} comments
          </button>

          {/* Time */}
          <p className="text-[10px] text-muted-foreground mt-1 uppercase">{timeAgo}</p>
        </div>
      </article>

      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={postId}
        postUserId={userId}
      />
    </>
  );
};

export default PostCard;
