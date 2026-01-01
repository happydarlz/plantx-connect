import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Heart, MessageCircle, UserPlus, Loader2, Leaf, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ActivityStats {
  totalPostLikes: number;
  totalPlantLikes: number;
  totalReelLikes: number;
  totalComments: number;
  totalFollowers: number;
  newFollowersWeek: number;
}

const ActivityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchActivityStats();
  }, [user, navigate]);

  const fetchActivityStats = async () => {
    if (!user) return;

    try {
      // Fetch user's posts and get likes on them
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user.id);

      const postIds = userPosts?.map(p => p.id) || [];
      
      let totalPostLikes = 0;
      if (postIds.length > 0) {
        const { count } = await supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .in("post_id", postIds);
        totalPostLikes = count || 0;
      }

      // Fetch user's plants and get likes on them
      const { data: userPlants } = await supabase
        .from("plants")
        .select("id")
        .eq("user_id", user.id);

      const plantIds = userPlants?.map(p => p.id) || [];
      
      let totalPlantLikes = 0;
      if (plantIds.length > 0) {
        const { count } = await supabase
          .from("plant_likes")
          .select("id", { count: "exact" })
          .in("plant_id", plantIds);
        totalPlantLikes = count || 0;
      }

      // Fetch user's reels and get likes on them
      const { data: userReels } = await supabase
        .from("reels")
        .select("id")
        .eq("user_id", user.id);

      const reelIds = userReels?.map(r => r.id) || [];
      
      let totalReelLikes = 0;
      if (reelIds.length > 0) {
        const { count } = await supabase
          .from("reel_likes")
          .select("id", { count: "exact" })
          .in("reel_id", reelIds);
        totalReelLikes = count || 0;
      }

      // Fetch comments on user's posts
      let totalComments = 0;
      if (postIds.length > 0) {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: "exact" })
          .in("post_id", postIds);
        totalComments = count || 0;
      }

      // Fetch total followers
      const { count: totalFollowers } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("following_id", user.id);

      // Fetch new followers this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: newFollowersWeek } = await supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("following_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      setStats({
        totalPostLikes,
        totalPlantLikes,
        totalReelLikes,
        totalComments: totalComments || 0,
        totalFollowers: totalFollowers || 0,
        newFollowersWeek: newFollowersWeek || 0,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalLikes = (stats?.totalPostLikes || 0) + (stats?.totalPlantLikes || 0) + (stats?.totalReelLikes || 0);

  const activities = stats ? [
    { icon: Heart, text: `Your content received ${totalLikes} total likes`, detail: `Posts: ${stats.totalPostLikes} · Reels: ${stats.totalReelLikes} · Plants: ${stats.totalPlantLikes}` },
    { icon: MessageCircle, text: `${stats.totalComments} comments on your posts`, detail: "Total engagement" },
    { icon: UserPlus, text: `You have ${stats.totalFollowers} followers`, detail: `+${stats.newFollowersWeek} this week` },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Your Activity</h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="p-6 bg-card rounded-xl border border-border text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-foreground">{totalLikes}</h2>
            <p className="text-muted-foreground text-sm">Total likes on your content</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-card rounded-xl border border-border text-center">
              <Leaf className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{stats?.totalPlantLikes || 0}</p>
              <p className="text-xs text-muted-foreground">Plant likes</p>
            </div>
            <div className="p-4 bg-card rounded-xl border border-border text-center">
              <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{stats?.totalPostLikes || 0}</p>
              <p className="text-xs text-muted-foreground">Post likes</p>
            </div>
            <div className="p-4 bg-card rounded-xl border border-border text-center">
              <Play className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{stats?.totalReelLikes || 0}</p>
              <p className="text-xs text-muted-foreground">Reel likes</p>
            </div>
          </div>

          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="p-4 bg-card rounded-xl border border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <activity.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm">{activity.text}</p>
                  <p className="text-muted-foreground text-xs">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ActivityPage;
