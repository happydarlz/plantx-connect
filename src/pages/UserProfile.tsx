import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import UserProfileCard from "@/components/UserProfileCard";
import { supabase } from "@/integrations/supabase/client";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (username) {
      fetchUser();
    }
  }, [username]);

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username?.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserId(data.user_id);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !userId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">User Not Found</h1>
        <p className="text-muted-foreground text-center">
          The user @{username} doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return <UserProfileCard userId={userId} username={username || ""} />;
};

export default UserProfile;
