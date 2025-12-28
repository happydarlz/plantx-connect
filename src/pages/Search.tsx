import { useState, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import PlantCard from "@/components/PlantCard";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

interface Plant {
  id: string;
  name: string;
  image_url: string | null;
  height: string | null;
  size: string | null;
  price: number | null;
  profiles: {
    nursery_name: string;
  } | null;
}

const popularTags = ["Indoor", "Outdoor", "Succulents", "Flowering", "Low Light", "Pet Safe"];

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"plants" | "nurseries">("plants");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase
        .from("plants")
        .select("id, name, image_url, height, size, price, user_id")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch profile data for each plant
      const plantsWithProfiles = await Promise.all(
        (data || []).map(async (plant) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("nursery_name")
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

  const filteredPlants = plants.filter(
    (plant) =>
      plant.name.toLowerCase().includes(query.toLowerCase()) ||
      plant.profiles?.nursery_name.toLowerCase().includes(query.toLowerCase())
  );

  // Mock plants if none exist
  const displayPlants = filteredPlants.length > 0 ? filteredPlants : query ? [] : [
    {
      id: "1",
      name: "Monstera Deliciosa",
      image_url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop",
      height: "2-3 ft",
      size: "Large",
      price: 1200,
      profiles: { nursery_name: "Green Paradise" },
    },
    {
      id: "2",
      name: "Peace Lily",
      image_url: "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop",
      height: "1-2 ft",
      size: "Medium",
      price: 450,
      profiles: { nursery_name: "Urban Jungle" },
    },
    {
      id: "3",
      name: "Snake Plant",
      image_url: "https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400&h=400&fit=crop",
      height: "2-4 ft",
      size: "Medium",
      price: 350,
      profiles: { nursery_name: "Bloom & Grow" },
    },
    {
      id: "4",
      name: "Fiddle Leaf Fig",
      image_url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop",
      height: "4-6 ft",
      size: "Large",
      price: 2500,
      profiles: { nursery_name: "Plant Paradise" },
    },
  ];

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
            placeholder="Search plants, nurseries, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-10 h-12 rounded-xl bg-secondary border-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mt-4">
          {(["plants", "nurseries"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Popular Tags */}
      {!query && (
        <section className="px-4 py-3">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Popular Tags</h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1.5 rounded-full bg-plantx-light text-primary text-sm font-medium"
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>
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
              ) : displayPlants.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {displayPlants.map((plant, index) => (
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
                        price={plant.price || undefined}
                        nurseryName={plant.profiles?.nursery_name || "Unknown"}
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

          {activeTab === "nurseries" && (
            <motion.div
              key="nurseries"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">Nursery search coming soon!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <BottomNav />
    </div>
  );
};

export default Search;
