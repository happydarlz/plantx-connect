import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Share2, MapPin, Grid3X3, Leaf, Film, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

// Mock profile data
const profile = {
  name: "Green Paradise Nursery",
  username: "greenparadise",
  bio: "Premium indoor & outdoor plants 🌿 Delivering nature to your doorstep since 2018",
  avatar: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop",
  address: "Mumbai, Maharashtra",
  postsCount: 156,
  followers: 12400,
  following: 234,
};

const tabs = [
  { id: "posts", icon: Grid3X3, label: "Posts" },
  { id: "plants", icon: Leaf, label: "Plants" },
  { id: "reels", icon: Film, label: "Reels" },
  { id: "saved", icon: Bookmark, label: "Saved" },
];

// Mock posts for grid
const posts = [
  "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400&h=400&fit=crop",
];

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwnProfile = true; // In real app, check if viewing own profile

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          {isOwnProfile && (
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          )}
          {!isOwnProfile && (
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* Profile Info */}
      <section className="px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <motion.div
            className="story-ring rounded-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-background p-0.5">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </motion.div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-semibold text-foreground">{profile.postsCount}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{formatNumber(profile.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{formatNumber(profile.following)}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-4">
          <h2 className="font-semibold text-foreground">{profile.name}</h2>
          <p className="text-sm text-foreground mt-1">{profile.bio}</p>
          <button className="flex items-center gap-1 text-sm text-primary mt-2">
            <MapPin className="w-4 h-4" />
            {profile.address}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {isOwnProfile ? (
            <>
              <Button variant="outline" className="flex-1 h-10 rounded-xl border-border">
                Edit Profile
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl border-border">
                Share Profile
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-1 h-10 rounded-xl ${
                  isFollowing
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl border-border">
                Message
              </Button>
            </>
          )}
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

      {/* Content Grid */}
      <section className="grid grid-cols-3 gap-0.5">
        {posts.map((post, index) => (
          <motion.button
            key={index}
            className="aspect-square bg-secondary relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <img src={post} alt="" className="w-full h-full object-cover" />
          </motion.button>
        ))}
      </section>

      <BottomNav />
    </div>
  );
};

export default Profile;
