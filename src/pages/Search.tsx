import { useState, useEffect } from "react";
import { Search as SearchIcon, X, User, Leaf, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import PlantCard from "@/components/PlantCard";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Plant {
  id: string;
  name: string;
  image_url: string | null;
  height: string | null;
  size: string | null;
  tags: string[] | null;
  profiles: {
    nursery_name: string;
    username: string;
  } | null;
}

interface UserProfile {
  user_id: string;
  username: string;
  nursery_name: string;
  profile_image: string | null;
  bio: string | null;
}

const popularTags = ["Indoor", "Outdoor", "Succulents", "Flowering", "Low Light", "Pet Safe", "Rare", "Tropical"];

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"plants" | "users" | "tags">("plants");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (query.length > 0 || selectedTag) {
      performSearch();
    } else {
      fetchAllPlants();
    }
  }, [query, activeTab, selectedTag]);

  const fetchAllPlants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("plants")
        .select("id, name, image_url, height, size, tags, user_id")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const plantsWithProfiles = await Promise.all(
        (data || []).map(async (plant) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("nursery_name, username")
            .eq("user_id", plant.user_id)
            .maybeSingle();
          return { ...plant, profiles: profileData };
        })
      );

      setPlants(plantsWithProfiles);
    } catch (error) {
      console.error("Error fetching plants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "plants") {
        let plantsQuery = supabase.from("plants").select("id, name, image_url, height, size, tags, user_id");

        if (selectedTag) {
          plantsQuery = plantsQuery.contains("tags", [selectedTag]);
        }

        const { data, error } = await plantsQuery.order("created_at", { ascending: false }).limit(50);

        if (error) throw error;

        let filteredPlants = data || [];

        if (query) {
          filteredPlants = filteredPlants.filter((plant) =>
            plant.name.toLowerCase().includes(query.toLowerCase())
          );
        }

        const plantsWithProfiles = await Promise.all(
          filteredPlants.map(async (plant) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("nursery_name, username")
              .eq("user_id", plant.user_id)
              .maybeSingle();
            return { ...plant, profiles: profileData };
          })
        );

        setPlants(plantsWithProfiles);
      } else if (activeTab === "users") {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, username, nursery_name, profile_image, bio")
          .or(`username.ilike.%${query}%,nursery_name.ilike.%${query}%`)
          .limit(20);

        if (error) throw error;
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
      setActiveTab("plants");
    }
  };

  const goToUserProfile = (username: string) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 px-4 pt-4 pb-3">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Discover</h1>

        {/* Search bar */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search plants, nurseries, usernames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-10 h-12 rounded-xl bg-secondary border-0"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedTag(null);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mt-4">
          {(["plants", "users", "tags"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tab === "plants" && <Leaf className="w-4 h-4" />}
              {tab === "users" && <User className="w-4 h-4" />}
              {tab === "tags" && <Hash className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Popular Tags */}
      {activeTab === "tags" && (
        <section className="px-4 py-3">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Popular Tags</h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-plantx-light text-primary"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedTag && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1">
              #{selectedTag}
              <button onClick={() => setSelectedTag(null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Results */}
      <section className="px-4 py-3">
        <AnimatePresence mode="wait">
          {activeTab === "plants" && (
            <motion.div
              key="plants"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <motion.div
                    className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : plants.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {plants.map((plant, index) => (
                    <motion.div
                      key={plant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PlantCard
                        name={plant.name}
                        image={plant.image_url || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=400&h=400&fit=crop"}
                        height={plant.height || "N/A"}
                        size={plant.size || "N/A"}
                        nurseryName={plant.profiles?.nursery_name || "Unknown"}
                        onClick={() => plant.profiles?.username && goToUserProfile(plant.profiles.username)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No plants found</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <motion.div
                    className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user, index) => (
                    <motion.button
                      key={user.user_id}
                      onClick={() => goToUserProfile(user.username)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary">
                        <img
                          src={user.profile_image || "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=100"}
                          alt={user.nursery_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground">{user.nursery_name}</h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Search for users by username or nursery name</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "tags" && !selectedTag && (
            <motion.div
              key="tags-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select a tag to browse plants</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <BottomNav />
    </div>
  );
};

export default Search;
