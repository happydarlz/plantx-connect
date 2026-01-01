import { useState, useEffect } from "react";
import { ArrowLeft, Grid3X3, Film, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SavedPost {
  id: string;
  post: { id: string; image_url: string } | null;
}

interface SavedReel {
  id: string;
  reel: { id: string; video_url: string } | null;
}

const SavedPosts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [savedReels, setSavedReels] = useState<SavedReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchSaved();
  }, [user, navigate]);

  const fetchSaved = async () => {
    if (!user) return;

    try {
      const [postsResult, reelsResult] = await Promise.all([
        supabase.from("post_saves").select("id, post_id").eq("user_id", user.id),
        supabase.from("reel_saves").select("id, reel_id").eq("user_id", user.id),
      ]);

      if (postsResult.data && postsResult.data.length > 0) {
        const postIds = postsResult.data.map((s) => s.post_id);
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, image_url")
          .in("id", postIds);

        const mapped = postsResult.data.map((s) => ({
          id: s.id,
          post: postsData?.find((p) => p.id === s.post_id) || null,
        }));
        setSavedPosts(mapped);
      }

      if (reelsResult.data && reelsResult.data.length > 0) {
        const reelIds = reelsResult.data.map((s) => s.reel_id);
        const { data: reelsData } = await supabase
          .from("reels")
          .select("id, video_url")
          .in("id", reelIds);

        const mapped = reelsResult.data.map((s) => ({
          id: s.id,
          reel: reelsData?.find((r) => r.id === s.reel_id) || null,
        }));
        setSavedReels(mapped);
      }
    } catch (error) {
      console.error("Error fetching saved:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Saved</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 flex justify-center items-center gap-2 ${
            activeTab === "posts" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <Grid3X3 className="w-5 h-5" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex-1 py-3 flex justify-center items-center gap-2 ${
            activeTab === "reels" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <Film className="w-5 h-5" />
          Reels
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeTab === "posts" ? (
        savedPosts.filter((s) => s.post).length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No saved posts</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {savedPosts.filter((s) => s.post).map((saved) => (
              <div key={saved.id} className="aspect-square bg-secondary">
                <img src={saved.post!.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )
      ) : savedReels.filter((s) => s.reel).length === 0 ? (
        <div className="text-center py-12">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No saved reels</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {savedReels.filter((s) => s.reel).map((saved) => (
            <div key={saved.id} className="aspect-[9/16] bg-secondary">
              <video src={saved.reel!.video_url} className="w-full h-full object-cover" muted />
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default SavedPosts;