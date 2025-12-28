import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { sendCommentNotification } from "@/lib/notifications";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    nursery_name: string;
    profile_image: string | null;
  } | null;
}

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postUserId: string;
}

const CommentsSheet = ({ open, onOpenChange, postId, postUserId }: CommentsSheetProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && postId) {
      fetchComments();

      // Real-time subscription
      const channel = supabase
        .channel(`comments-${postId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
          () => fetchComments()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, nursery_name, profile_image")
            .eq("user_id", comment.user_id)
            .maybeSingle();
          return { ...comment, profiles: profileData };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      // Create notification for post owner
      if (postUserId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: postUserId,
          type: "comment",
          from_user_id: user.id,
          post_id: postId,
          message_text: newComment.trim().slice(0, 50),
        });
        // Send browser notification
        if (profile) sendCommentNotification(profile.username);
      }

      setNewComment("");
    } catch (error) {
      toast({ title: "Failed to post comment", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabase.from("comments").delete().eq("id", commentId);
      toast({ title: "Comment deleted" });
    } catch (error) {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    }
  };

  const formatTime = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  const goToProfile = (username: string) => {
    onOpenChange(false);
    navigate(`/user/${username}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl px-0">
        <SheetHeader className="px-4 pb-3 border-b border-border">
          <SheetTitle className="text-center">Comments</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(70vh-60px)]">
          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <button onClick={() => comment.profiles?.username && goToProfile(comment.profiles.username)}>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={comment.profiles?.profile_image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {comment.profiles?.nursery_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          onClick={() => comment.profiles?.username && goToProfile(comment.profiles.username)}
                          className="font-semibold text-sm text-foreground hover:underline"
                        >
                          {comment.profiles?.username || "unknown"}
                        </button>
                        <span className="text-xs text-muted-foreground ml-2">{formatTime(comment.created_at)}</span>
                      </div>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 hover:bg-secondary rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          {user && (
            <div className="border-t border-border p-4 flex items-center gap-3">
              <Input
                ref={inputRef}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                className="flex-1 h-10 rounded-full bg-secondary border-0"
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSending}
                className="text-primary font-semibold disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
