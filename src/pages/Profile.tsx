import { useState, useEffect } from "react";
import { Settings, Share2, MapPin, Grid3X3, Leaf, Film, Bookmark, Link as LinkIcon, Trash2, MoreVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BottomNav from "@/components/BottomNav";
import EditProfileSheet from "@/components/EditProfileSheet";
import SettingsSheet from "@/components/SettingsSheet";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import FollowersSheet from "@/components/FollowersSheet";
import ContentDetailSheet from "@/components/ContentDetailSheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { id: "posts", icon: Grid3X3, label: "Posts" },
  { id: "plants", icon: Leaf, label: "Plants" },
  { id: "reels", icon: Film, label: "Reels" },
  { id: "saved", icon: Bookmark, label: "Saved" },
];

interface Stats {
  postsCount: number;
  followers: number;
  following: number;
}

interface Post {
  id: string;
  image_url: string;
  image_urls?: string[] | null;
}

interface Plant {
  id: string;
  image_url: string | null;
  image_urls?: string[] | null;
  name: string;
}

interface Reel {
  id: string;
  video_url: string;
  caption: string | null;
}

interface SavedPost {
  id: string;
  post: {
    id: string;
    image_url: string;
  } | null;
}

interface SavedReel {
  id: string;
  reel: {
    id: string;
    video_url: string;
    caption: string | null;
  } | null;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const Profile = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  const [savedFilter, setSavedFilter] = useState<"posts" | "reels">("posts");
  const [stats, setStats] = useState<Stats>({ postsCount: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [savedReels, setSavedReels] = useState<SavedReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [followersSheetOpen, setFollowersSheetOpen] = useState(false);
  const [followersSheetType, setFollowersSheetType] = useState<"followers" | "following">("followers");
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "post" | "plant" | "reel"; id: string; urls?: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Content detail/edit state
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{ type: "post" | "plant" | "reel"; id: string } | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [postsResult, plantsResult, reelsResult, savedPostsResult, savedReelsResult, followersResult, followingResult] = await Promise.all([
        supabase.from("posts").select("id, image_url, image_urls", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("plants").select("id, image_url, image_urls, name").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reels").select("id, video_url, caption").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("post_saves").select("id, post_id").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reel_saves").select("id, reel_id").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("id", { count: "exact" }).eq("following_id", user.id),
        supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", user.id),
      ]);

      setPosts(postsResult.data || []);
      setPlants(plantsResult.data || []);
      setReels(reelsResult.data || []);

      // Fetch saved posts details
      if (savedPostsResult.data && savedPostsResult.data.length > 0) {
        const postIds = savedPostsResult.data.map((s) => s.post_id);
        const { data: savedPostsData } = await supabase
          .from("posts")
          .select("id, image_url")
          .in("id", postIds);
        
        const mappedSaved = savedPostsResult.data.map((s) => ({
          id: s.id,
          post: savedPostsData?.find((p) => p.id === s.post_id) || null,
        }));
        setSavedPosts(mappedSaved);
      }

      // Fetch saved reels details
      if (savedReelsResult.data && savedReelsResult.data.length > 0) {
        const reelIds = savedReelsResult.data.map((s) => s.reel_id);
        const { data: savedReelsData } = await supabase
          .from("reels")
          .select("id, video_url, caption")
          .in("id", reelIds);
        
        const mappedSavedReels = savedReelsResult.data.map((s) => ({
          id: s.id,
          reel: savedReelsData?.find((r) => r.id === s.reel_id) || null,
        }));
        setSavedReels(mappedSavedReels);
      }

      setStats({
        postsCount: postsResult.count || 0,
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/user/${profile?.username}`;
    try {
      await navigator.share({
        title: `${profile?.nursery_name} on PlantX`,
        url,
      });
    } catch {
      await navigator.clipboard.writeText(url);
      toast({ title: "Profile link copied!", description: url });
    }
  };

  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/storage/v1/object/public/uploads/");
      if (pathParts.length > 1) {
        return pathParts[1];
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDeleteClick = (type: "post" | "plant" | "reel", id: string, urls?: string[]) => {
    setDeleteTarget({ type, id, urls });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      const { type, id, urls } = deleteTarget;
      
      // Delete files from storage
      if (urls && urls.length > 0) {
        const filePaths = urls
          .map(extractFilePathFromUrl)
          .filter((path): path is string => path !== null);
        
        if (filePaths.length > 0) {
          await supabase.storage.from("uploads").remove(filePaths);
        }
      }
      
      // Delete from database based on type
      if (type === "post") {
        // Delete related data first
        await supabase.from("post_likes").delete().eq("post_id", id);
        await supabase.from("post_saves").delete().eq("post_id", id);
        await supabase.from("comments").delete().eq("post_id", id);
        await supabase.from("posts").delete().eq("id", id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else if (type === "plant") {
        await supabase.from("plant_likes").delete().eq("plant_id", id);
        await supabase.from("plant_saves").delete().eq("plant_id", id);
        await supabase.from("plant_comments").delete().eq("plant_id", id);
        await supabase.from("plants").delete().eq("id", id);
        setPlants((prev) => prev.filter((p) => p.id !== id));
      } else if (type === "reel") {
        await supabase.from("reel_likes").delete().eq("reel_id", id);
        await supabase.from("reel_saves").delete().eq("reel_id", id);
        await supabase.from("reel_comments").delete().eq("reel_id", id);
        await supabase.from("reels").delete().eq("id", id);
        setReels((prev) => prev.filter((r) => r.id !== id));
      }
      
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
      setStats((prev) => ({ ...prev, postsCount: prev.postsCount - (type === "post" ? 1 : 0) }));
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "Error deleting", description: "Please try again", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleContentClick = (type: "post" | "plant" | "reel", id: string) => {
    setSelectedContent({ type, id });
    setIsEditingContent(false);
    setDetailSheetOpen(true);
  };

  const handleEditClick = (type: "post" | "plant" | "reel", id: string) => {
    setSelectedContent({ type, id });
    setIsEditingContent(true);
    setDetailSheetOpen(true);
  };

  const handleShareToStory = async (imageUrl: string) => {
    if (!user) return;
    
    try {
      await supabase.from("stories").insert({
        user_id: user.id,
        image_url: imageUrl,
      });
      toast({ title: "Shared to your story!" });
    } catch (error) {
      toast({ title: "Error sharing to story", variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    if (activeTab === "posts") {
      if (posts.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="aspect-square bg-secondary relative overflow-hidden group cursor-pointer"
              onClick={() => handleContentClick("post", post.id)}
            >
              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <MoreVertical className="w-4 h-4 text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick("post", post.id); }} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShareToStory(post.image_url); }} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share to Story
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick("post", post.id, post.image_urls || [post.image_url]); }} 
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "plants") {
      if (plants.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No plants listed yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {plants.map((plant) => (
            <div 
              key={plant.id} 
              className="aspect-square bg-secondary relative overflow-hidden group cursor-pointer"
              onClick={() => handleContentClick("plant", plant.id)}
            >
              {plant.image_url ? (
                <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <MoreVertical className="w-4 h-4 text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick("plant", plant.id); }} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Plant
                  </DropdownMenuItem>
                  {plant.image_url && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShareToStory(plant.image_url!); }} className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share to Story
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick("plant", plant.id, plant.image_urls || (plant.image_url ? [plant.image_url] : [])); }} 
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "reels") {
      if (reels.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reels yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {reels.map((reel) => (
            <div 
              key={reel.id} 
              className="aspect-[9/16] bg-secondary relative overflow-hidden group cursor-pointer"
              onClick={() => handleContentClick("reel", reel.id)}
            >
              <video src={reel.video_url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <Film className="w-6 h-6 text-white" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <MoreVertical className="w-4 h-4 text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick("reel", reel.id); }} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Reel
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick("reel", reel.id, [reel.video_url]); }} 
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "saved") {
      return (
        <div>
          {/* Saved filter */}
          <div className="flex gap-2 p-4">
            <button
              onClick={() => setSavedFilter("posts")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                savedFilter === "posts" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setSavedFilter("reels")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                savedFilter === "reels" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Reels
            </button>
          </div>

          {savedFilter === "posts" && (
            <>
              {savedPosts.filter((s) => s.post).length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No saved posts</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5">
                  {savedPosts.filter((s) => s.post).map((saved) => (
                    <button key={saved.id} className="aspect-square bg-secondary relative overflow-hidden">
                      <img src={saved.post!.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {savedFilter === "reels" && (
            <>
              {savedReels.filter((s) => s.reel).length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No saved reels</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5">
                  {savedReels.filter((s) => s.reel).map((saved) => (
                    <button key={saved.id} className="aspect-[9/16] bg-secondary relative overflow-hidden">
                      <video src={saved.reel!.video_url} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return null;
  };

  // Get profile links
  const profileLinks = (() => {
    try {
      const links = (profile as any)?.profile_links;
      if (Array.isArray(links)) return links;
      return [];
    } catch {
      return [];
    }
  })();

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShareProfile}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Profile Info */}
      <section className="px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
            <img
              src={profile.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=200&h=200&fit=crop"}
              alt={profile.nursery_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-semibold text-foreground">{stats.postsCount}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <button onClick={() => { setFollowersSheetType("followers"); setFollowersSheetOpen(true); }}>
              <p className="font-semibold text-foreground">{formatNumber(stats.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <button onClick={() => { setFollowersSheetType("following"); setFollowersSheetOpen(true); }}>
              <p className="font-semibold text-foreground">{formatNumber(stats.following)}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-4">
          <h2 className="font-semibold text-foreground">{profile.nursery_name}</h2>
          {profile.bio && <p className="text-sm text-foreground mt-1">{profile.bio}</p>}
          {profile.address && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <MapPin className="w-4 h-4" />
              {profile.address}
            </div>
          )}
          
          {/* Profile Links */}
          {profileLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profileLinks.map((link: { title: string; url: string }, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="w-3 h-3" />
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            className="flex-1 h-10 rounded-xl border-border"
            onClick={() => setEditProfileOpen(true)}
          >
            Edit Profile
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-10 rounded-xl border-border"
            onClick={handleShareProfile}
          >
            Share Profile
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-t border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex justify-center transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      <EditProfileSheet open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FollowersSheet 
        open={followersSheetOpen} 
        onOpenChange={setFollowersSheetOpen} 
        userId={user?.id || ""} 
        type={followersSheetType} 
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteTarget?.type || "content"}?`}
        description="This action cannot be undone. This will permanently delete your content from our servers including all associated likes, comments, and saves."
        isLoading={isDeleting}
      />
      {selectedContent && (
        <ContentDetailSheet
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          contentType={selectedContent.type}
          contentId={selectedContent.id}
          isEditing={isEditingContent}
          onUpdate={fetchData}
        />
      )}
      <BottomNav />
    </div>
  );
};

export default Profile;