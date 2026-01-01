import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { sendLikeNotification, sendCommentNotification } from "@/lib/notifications";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    profile_image: string | null;
  };
  replies?: Comment[];
  parent_id?: string;
}

interface ContentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "post" | "plant" | "reel";
  contentId: string;
  isEditing?: boolean;
  onUpdate?: () => void;
}

const ContentDetailSheet = ({
  open,
  onOpenChange,
  contentType,
  contentId,
  isEditing = false,
  onUpdate,
}: ContentDetailSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit state
  const [editMode, setEditMode] = useState(isEditing);
  const [editCaption, setEditCaption] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);

  useEffect(() => {
    if (open && contentId) {
      fetchContent();
      setEditMode(isEditing);
    }
  }, [open, contentId, isEditing]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      let contentData: any = null;
      let likesCount = 0;
      let commentsData: Comment[] = [];
      let userLiked = false;

      if (contentType === "post") {
        const [postRes, likesRes, commentsRes, userLikeRes] = await Promise.all([
          supabase.from("posts").select("*").eq("id", contentId).single(),
          supabase.from("post_likes").select("id", { count: "exact" }).eq("post_id", contentId),
          supabase.from("comments").select("*").eq("post_id", contentId).order("created_at", { ascending: true }),
          user ? supabase.from("post_likes").select("id").eq("post_id", contentId).eq("user_id", user.id) : Promise.resolve({ data: [] }),
        ]);
        contentData = postRes.data;
        likesCount = likesRes.count || 0;
        commentsData = commentsRes.data || [];
        userLiked = (userLikeRes.data?.length || 0) > 0;
        setEditCaption(contentData?.caption || "");
        setEditImages(contentData?.image_urls || [contentData?.image_url] || []);
      } else if (contentType === "plant") {
        const [plantRes, likesRes, commentsRes, userLikeRes] = await Promise.all([
          supabase.from("plants").select("*").eq("id", contentId).single(),
          supabase.from("plant_likes").select("id", { count: "exact" }).eq("plant_id", contentId),
          supabase.from("plant_comments").select("*").eq("plant_id", contentId).order("created_at", { ascending: true }),
          user ? supabase.from("plant_likes").select("id").eq("plant_id", contentId).eq("user_id", user.id) : Promise.resolve({ data: [] }),
        ]);
        contentData = plantRes.data;
        likesCount = likesRes.count || 0;
        commentsData = commentsRes.data || [];
        userLiked = (userLikeRes.data?.length || 0) > 0;
        setEditName(contentData?.name || "");
        setEditDescription(contentData?.description || "");
        setEditImages(contentData?.image_urls || (contentData?.image_url ? [contentData.image_url] : []) || []);
      } else if (contentType === "reel") {
        const [reelRes, likesRes, commentsRes, userLikeRes] = await Promise.all([
          supabase.from("reels").select("*").eq("id", contentId).single(),
          supabase.from("reel_likes").select("id", { count: "exact" }).eq("reel_id", contentId),
          supabase.from("reel_comments").select("*").eq("reel_id", contentId).order("created_at", { ascending: true }),
          user ? supabase.from("reel_likes").select("id").eq("reel_id", contentId).eq("user_id", user.id) : Promise.resolve({ data: [] }),
        ]);
        contentData = reelRes.data;
        likesCount = likesRes.count || 0;
        commentsData = commentsRes.data || [];
        userLiked = (userLikeRes.data?.length || 0) > 0;
        setEditCaption(contentData?.caption || "");
      }

      // Fetch comment user profiles
      if (commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, profile_image")
          .in("user_id", userIds);

        commentsData = commentsData.map((c) => ({
          ...c,
          profile: profiles?.find((p) => p.user_id === c.user_id),
        }));
      }

      setContent(contentData);
      setLikes(likesCount);
      setComments(commentsData);
      setIsLiked(userLiked);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !content) return;

    const ownerId = content.user_id;

    if (contentType === "post") {
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", contentId).eq("user_id", user.id);
        setLikes((prev) => prev - 1);
      } else {
        await supabase.from("post_likes").insert({ post_id: contentId, user_id: user.id });
        setLikes((prev) => prev + 1);
        if (ownerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: ownerId,
            type: "like",
            from_user_id: user.id,
            post_id: contentId,
          });
          const { data: profile } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
          if (profile) sendLikeNotification(profile.username, "post");
        }
      }
    } else if (contentType === "plant") {
      if (isLiked) {
        await supabase.from("plant_likes").delete().eq("plant_id", contentId).eq("user_id", user.id);
        setLikes((prev) => prev - 1);
      } else {
        await supabase.from("plant_likes").insert({ plant_id: contentId, user_id: user.id });
        setLikes((prev) => prev + 1);
        if (ownerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: ownerId,
            type: "like",
            from_user_id: user.id,
          });
          const { data: profile } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
          if (profile) sendLikeNotification(profile.username);
        }
      }
    } else if (contentType === "reel") {
      if (isLiked) {
        await supabase.from("reel_likes").delete().eq("reel_id", contentId).eq("user_id", user.id);
        setLikes((prev) => prev - 1);
      } else {
        await supabase.from("reel_likes").insert({ reel_id: contentId, user_id: user.id });
        setLikes((prev) => prev + 1);
        if (ownerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: ownerId,
            type: "like",
            from_user_id: user.id,
          });
          const { data: profile } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
          if (profile) sendLikeNotification(profile.username, "reel");
        }
      }
    }
    setIsLiked(!isLiked);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !content) return;

    let data: any = null;
    let error: any = null;
    const ownerId = content.user_id;

    if (contentType === "post") {
      const result = await supabase
        .from("comments")
        .insert({ post_id: contentId, user_id: user.id, content: newComment.trim() })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else if (contentType === "plant") {
      const result = await supabase
        .from("plant_comments")
        .insert({ plant_id: contentId, user_id: user.id, content: newComment.trim() })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else if (contentType === "reel") {
      const result = await supabase
        .from("reel_comments")
        .insert({ reel_id: contentId, user_id: user.id, content: newComment.trim() })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (!error && data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, username, profile_image")
        .eq("user_id", user.id)
        .single();

      setComments((prev) => [...prev, { ...data, profile }]);
      setNewComment("");

      // Send notification to content owner
      if (ownerId !== user.id && profile) {
        await supabase.from("notifications").insert({
          user_id: ownerId,
          type: "comment",
          from_user_id: user.id,
          post_id: contentType === "post" ? contentId : null,
          message_text: newComment.trim().slice(0, 50),
        });
        sendCommentNotification(profile.username);
      }
    }
  };

  const handleReply = async (parentCommentId: string) => {
    if (!user || !replyText.trim()) return;

    let data: any = null;
    let error: any = null;

    if (contentType === "post") {
      const result = await supabase
        .from("comments")
        .insert({ post_id: contentId, user_id: user.id, content: `@reply: ${replyText.trim()}` })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else if (contentType === "plant") {
      const result = await supabase
        .from("plant_comments")
        .insert({ plant_id: contentId, user_id: user.id, content: `@reply: ${replyText.trim()}` })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else if (contentType === "reel") {
      const result = await supabase
        .from("reel_comments")
        .insert({ reel_id: contentId, user_id: user.id, content: `@reply: ${replyText.trim()}` })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (!error && data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, username, profile_image")
        .eq("user_id", user.id)
        .single();

      setComments((prev) => [...prev, { ...data, profile }]);
      setReplyText("");
      setReplyingTo(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      if (contentType === "post") {
        await supabase
          .from("posts")
          .update({
            caption: editCaption,
            image_urls: editImages,
            image_url: editImages[0] || content.image_url,
          })
          .eq("id", contentId);
      } else if (contentType === "plant") {
        await supabase
          .from("plants")
          .update({
            name: editName,
            description: editDescription,
            image_urls: editImages,
            image_url: editImages[0] || content.image_url,
          })
          .eq("id", contentId);
      } else if (contentType === "reel") {
        await supabase.from("reels").update({ caption: editCaption }).eq("id", contentId);
      }

      toast({ title: "Updated successfully" });
      setEditMode(false);
      fetchContent();
      onUpdate?.();
    } catch (error) {
      toast({ title: "Error updating", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
        setEditImages((prev) => [...prev, urlData.publicUrl]);
      }
    };
    input.click();
  };

  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center justify-between">
            {editMode ? `Edit ${contentType}` : `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Details`}
            {editMode && (
              <Button onClick={handleSaveEdit} disabled={isSaving} size="sm">
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Media preview */}
          {!editMode && contentType !== "reel" && (
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
              <img
                src={content?.image_url || editImages[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {contentType === "reel" && !editMode && (
            <div className="aspect-[9/16] max-h-[300px] rounded-xl overflow-hidden bg-secondary">
              <video src={content?.video_url} controls className="w-full h-full object-cover" />
            </div>
          )}

          {/* Edit images */}
          {editMode && contentType !== "reel" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Images</p>
              <div className="flex gap-2 flex-wrap">
                {editImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-destructive rounded-full"
                    >
                      <X className="w-3 h-3 text-destructive-foreground" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddImage}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Edit fields */}
          {editMode ? (
            <div className="space-y-3">
              {contentType === "plant" && (
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              {contentType === "plant" ? (
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground">Caption</label>
                  <Textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="flex items-center gap-6">
                <button onClick={handleLike} className="flex items-center gap-2">
                  <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                  <span className="font-medium">{likes}</span>
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-foreground" />
                  <span className="font-medium">{comments.length}</span>
                </div>
              </div>

              {/* Caption/Description */}
              {content?.caption && (
                <p className="text-sm text-foreground">{content.caption}</p>
              )}
              {content?.name && (
                <h3 className="font-semibold text-lg text-foreground">{content.name}</h3>
              )}
              {content?.description && (
                <p className="text-sm text-muted-foreground">{content.description}</p>
              )}

              {/* Comments */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Comments</h4>
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                ) : (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.profile?.profile_image || ""} />
                          <AvatarFallback>{comment.profile?.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-secondary rounded-lg p-2">
                            <p className="text-xs font-medium text-foreground">{comment.profile?.username || "User"}</p>
                            <p className="text-sm text-foreground">{comment.content}</p>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs text-primary font-medium"
                            >
                              Reply
                            </button>
                          </div>
                          {replyingTo === comment.id && (
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="text-sm h-8"
                              />
                              <Button size="sm" onClick={() => handleReply(comment.id)} className="h-8">
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContentDetailSheet;
