import { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LikedPost {
  id: string;
  post: { id: string; image_url: string } | null;
}

const LikedPosts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchLiked();
  }, [user, navigate]);

  const fetchLiked = async () => {
    if (!user) return;

    try {
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("id, post_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (likesData && likesData.length > 0) {
        const postIds = likesData.map((l) => l.post_id);
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, image_url")
          .in("id", postIds);

        const mapped = likesData.map((l) => ({
          id: l.id,
          post: postsData?.find((p) => p.id === l.post_id) || null,
        }));
        setLikedPosts(mapped);
      }
    } catch (error) {
      console.error("Error fetching liked:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Liked Posts</h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : likedPosts.filter((l) => l.post).length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No liked posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {likedPosts.filter((l) => l.post).map((liked) => (
            <div key={liked.id} className="aspect-square bg-secondary">
              <img src={liked.post!.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default LikedPosts;