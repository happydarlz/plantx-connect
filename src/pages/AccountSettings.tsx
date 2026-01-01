import { useState } from "react";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      // Delete user's content from storage
      const folders = ["posts", "plants", "reels", "profile"];
      for (const folder of folders) {
        const { data: files } = await supabase.storage.from("uploads").list(`${user.id}/${folder}`);
        if (files && files.length > 0) {
          const filePaths = files.map((f) => `${user.id}/${folder}/${f.name}`);
          await supabase.storage.from("uploads").remove(filePaths);
        }
      }

      // Delete user data from tables
      await Promise.all([
        supabase.from("posts").delete().eq("user_id", user.id),
        supabase.from("plants").delete().eq("user_id", user.id),
        supabase.from("reels").delete().eq("user_id", user.id),
        supabase.from("stories").delete().eq("user_id", user.id),
        supabase.from("post_likes").delete().eq("user_id", user.id),
        supabase.from("plant_likes").delete().eq("user_id", user.id),
        supabase.from("reel_likes").delete().eq("user_id", user.id),
        supabase.from("comments").delete().eq("user_id", user.id),
        supabase.from("plant_comments").delete().eq("user_id", user.id),
        supabase.from("reel_comments").delete().eq("user_id", user.id),
        supabase.from("follows").delete().eq("follower_id", user.id),
        supabase.from("follows").delete().eq("following_id", user.id),
        supabase.from("notifications").delete().eq("user_id", user.id),
        supabase.from("notifications").delete().eq("from_user_id", user.id),
        supabase.from("post_saves").delete().eq("user_id", user.id),
        supabase.from("plant_saves").delete().eq("user_id", user.id),
        supabase.from("reel_saves").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);

      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      await signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to delete account. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Account</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="p-4 bg-card rounded-xl border border-border">
          <h2 className="font-medium text-foreground mb-3">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground text-right truncate max-w-[180px]">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Username</span>
              <span className="text-foreground">@{profile?.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Type</span>
              <span className="text-foreground capitalize">{(profile as any)?.user_type || "Normal"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Phone</span>
              <span className="text-foreground">{(profile as any)?.phone_number || "Not set"}</span>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          className="w-full rounded-xl"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          This action is permanent and cannot be undone.
        </p>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        description="This will permanently delete your account and all your content including posts, reels, plants, and comments. This action cannot be undone."
        isLoading={isDeleting}
      />

      <BottomNav />
    </div>
  );
};

export default AccountSettings;