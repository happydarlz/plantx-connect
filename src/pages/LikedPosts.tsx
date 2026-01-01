import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type ContentType = "posts" | "reels" | "plants";

interface LikedItem {
  id: string;
  type: ContentType;
  imageUrl: string;
  videoUrl?: string;
}

const LikedPosts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ContentType>("posts");
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchLiked();
  }, [user, navigate, activeTab]);

  const fetchLiked = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      let items: LikedItem[] = [];

      if (activeTab === "posts") {
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

          items = likesData
            .map((l) => {
              const post = postsData?.find((p) => p.id === l.post_id);
              return post ? { id: l.id, type: "posts" as const, imageUrl: post.image_url } : null;
            })
            .filter(Boolean) as LikedItem[];
        }
      } else if (activeTab === "reels") {
        const { data: likesData } = await supabase
          .from("reel_likes")
          .select("id, reel_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likesData && likesData.length > 0) {
          const reelIds = likesData.map((l) => l.reel_id);
          const { data: reelsData } = await supabase
            .from("reels")
            .select("id, video_url")
            .in("id", reelIds);

          items = likesData
            .map((l) => {
              const reel = reelsData?.find((r) => r.id === l.reel_id);
              return reel ? { id: l.id, type: "reels" as const, imageUrl: "", videoUrl: reel.video_url } : null;
            })
            .filter(Boolean) as LikedItem[];
        }
      } else if (activeTab === "plants") {
        const { data: likesData } = await supabase
          .from("plant_likes")
          .select("id, plant_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likesData && likesData.length > 0) {
          const plantIds = likesData.map((l) => l.plant_id);
          const { data: plantsData } = await supabase
            .from("plants")
            .select("id, image_url")
            .in("id", plantIds);

          items = likesData
            .map((l) => {
              const plant = plantsData?.find((p) => p.id === l.plant_id);
              return plant && plant.image_url ? { id: l.id, type: "plants" as const, imageUrl: plant.image_url } : null;
            })
            .filter(Boolean) as LikedItem[];
        }
      }

      setLikedItems(items);
    } catch (error) {
      console.error("Error fetching liked:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { key: ContentType; label: string }[] = [
    { key: "posts", label: "Posts" },
    { key: "reels", label: "Reels" },
    { key: "plants", label: "Plants" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Liked Ones</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : likedItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No liked {activeTab} yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {likedItems.map((item) => (
            <div key={item.id} className="aspect-square bg-secondary relative">
              {item.type === "reels" && item.videoUrl ? (
                <>
                  <video
                    src={item.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </>
              ) : (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default LikedPosts;
