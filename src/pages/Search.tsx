import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import PlantCard from "@/components/PlantCard";
import BottomNav from "@/components/BottomNav";

// Mock data for plants
const plants = [
  {
    id: "1",
    name: "Monstera Deliciosa",
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop",
    height: "2-3 ft",
    size: "Large",
    price: 1200,
    nurseryName: "Green Paradise",
  },
  {
    id: "2",
    name: "Peace Lily",
    image: "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop",
    height: "1-2 ft",
    size: "Medium",
    price: 450,
    nurseryName: "Urban Jungle",
  },
  {
    id: "3",
    name: "Snake Plant",
    image: "https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400&h=400&fit=crop",
    height: "2-4 ft",
    size: "Medium",
    price: 350,
    nurseryName: "Bloom & Grow",
  },
  {
    id: "4",
    name: "Fiddle Leaf Fig",
    image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop",
    height: "4-6 ft",
    size: "Large",
    price: 2500,
    nurseryName: "Plant Paradise",
  },
  {
    id: "5",
    name: "Pothos",
    image: "https://images.unsplash.com/photo-1616095697286-e7c26b1b3b49?w=400&h=400&fit=crop",
    height: "Trailing",
    size: "Small",
    price: 199,
    nurseryName: "Green Haven",
  },
  {
    id: "6",
    name: "Rubber Plant",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop",
    height: "3-5 ft",
    size: "Large",
    price: 800,
    nurseryName: "Nature's Best",
  },
];

const popularTags = ["Indoor", "Outdoor", "Succulents", "Flowering", "Low Light", "Pet Safe"];

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"plants" | "nurseries">("plants");

  const filteredPlants = plants.filter(
    (plant) =>
      plant.name.toLowerCase().includes(query.toLowerCase()) ||
      plant.nurseryName.toLowerCase().includes(query.toLowerCase())
  );

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
              className="grid grid-cols-2 gap-3"
            >
              {filteredPlants.map((plant, index) => (
                <motion.div
                  key={plant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PlantCard {...plant} />
                </motion.div>
              ))}
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
