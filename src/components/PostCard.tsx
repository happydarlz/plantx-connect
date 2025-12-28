import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface PostCardProps {
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
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <article className="bg-card rounded-xl plantx-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-plantx-soft">
            <img src={nurseryImage} alt={nurseryName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{nurseryName}</h3>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-secondary">
        <img src={postImage} alt="Post" className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 0.8 }}
              className="p-1"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked ? "fill-red-500 text-red-500" : "text-foreground"
                }`}
              />
            </motion.button>
            <button className="p-1">
              <MessageCircle className="w-6 h-6 text-foreground" />
            </button>
            <button className="p-1">
              <Send className="w-6 h-6 text-foreground" />
            </button>
          </div>
          <motion.button
            onClick={() => setIsSaved(!isSaved)}
            whileTap={{ scale: 0.8 }}
            className="p-1"
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                isSaved ? "fill-foreground text-foreground" : "text-foreground"
              }`}
            />
          </motion.button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">{likeCount.toLocaleString()} likes</p>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold">{username}</span>{" "}
          <span className="text-foreground">{caption}</span>
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-plantx-light text-primary font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments */}
        <button className="text-sm text-muted-foreground mt-2">
          View all {comments} comments
        </button>

        {/* Time */}
        <p className="text-[10px] text-muted-foreground mt-1 uppercase">{timeAgo}</p>
      </div>
    </article>
  );
};

export default PostCard;
