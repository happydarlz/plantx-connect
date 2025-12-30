import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FollowUser {
  user_id: string;
  username: string;
  nursery_name: string;
  profile_image: string | null;
}

interface FollowersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
}

const FollowersSheet = ({ open, onOpenChange, userId, type }: FollowersSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (user) {
        fetchMyFollowing();
      }
    }
  }, [open, userId, type, user]);

  const fetchMyFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    
    if (data) {
      setFollowingIds(new Set(data.map(f => f.following_id)));
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let userIds: string[] = [];

      if (type === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId);
        userIds = data?.map(f => f.follower_id) || [];
      } else {
        const { data } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);
        userIds = data?.map(f => f.following_id) || [];
      }

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, nursery_name, profile_image")
          .in("user_id", userIds);
        
        setUsers(profiles || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    const isFollowing = followingIds.has(targetUserId);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      
      setFollowingIds(prev => new Set(prev).add(targetUserId));
    }
  };

  const handleUserClick = (username: string) => {
    onOpenChange(false);
    navigate(`/user/${username}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle>{type === "followers" ? "Followers" : "Following"}</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {type === "followers" ? "No followers yet" : "Not following anyone"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <button
                    onClick={() => handleUserClick(u.username)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u.profile_image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {u.nursery_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{u.nursery_name}</p>
                      <p className="text-sm text-muted-foreground">@{u.username}</p>
                    </div>
                  </button>
                  
                  {user && u.user_id !== user.id && (
                    <Button
                      variant={followingIds.has(u.user_id) ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollow(u.user_id)}
                      className="rounded-full"
                    >
                      {followingIds.has(u.user_id) ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FollowersSheet;
