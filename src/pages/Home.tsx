import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import PlantXLogo from "@/components/PlantXLogo";
import StoryCircle from "@/components/StoryCircle";
import PostCard from "@/components/PostCard";
import BottomNav from "@/components/BottomNav";

// Mock data for stories
const stories = [
  { id: "own", name: "Your Story", image: "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=150&h=150&fit=crop", isOwn: true },
  { id: "1", name: "Green Haven", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop" },
  { id: "2", name: "Plant Paradise", image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=150&h=150&fit=crop" },
  { id: "3", name: "Urban Garden", image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=150&h=150&fit=crop" },
  { id: "4", name: "Bloom Studio", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=150&h=150&fit=crop" },
  { id: "5", name: "Nature's Best", image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=150&h=150&fit=crop" },
];

// Mock data for posts
const posts = [
  {
    id: "1",
    nurseryName: "Green Paradise Nursery",
    username: "greenparadise",
    nurseryImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop",
    postImage: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop",
    caption: "Just received a fresh batch of Monstera Deliciosa! These beauties are ready for new homes 🌿",
    tags: ["Monstera", "IndoorPlants", "NewArrival"],
    likes: 234,
    comments: 18,
    timeAgo: "2 hours ago",
  },
  {
    id: "2",
    nurseryName: "Urban Jungle Co.",
    username: "urbanjungle",
    nurseryImage: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=150&h=150&fit=crop",
    postImage: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop",
    caption: "Sunday plant care routine 💚 Remember to check your plants for pests and give them some love!",
    tags: ["PlantCare", "Sunday", "GreenLife"],
    likes: 456,
    comments: 32,
    timeAgo: "5 hours ago",
  },
  {
    id: "3",
    nurseryName: "Bloom & Grow",
    username: "bloomgrow",
    nurseryImage: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=150&h=150&fit=crop",
    postImage: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&h=600&fit=crop",
    caption: "The perfect corner for your peace lily 🌱 DM us for delivery options!",
    tags: ["PeaceLily", "HomeDecor", "PlantShop"],
    likes: 189,
    comments: 12,
    timeAgo: "8 hours ago",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <PlantXLogo size="sm" />
          <button className="relative p-2 hover:bg-secondary rounded-full transition-colors">
            <Bell className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {/* Stories */}
      <section className="border-b border-border">
        <div className="flex gap-3 px-4 py-4 overflow-x-auto hide-scrollbar">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <StoryCircle
                name={story.name}
                image={story.image}
                isOwn={story.isOwn}
                hasStory={!story.isOwn}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="px-4 py-4 space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PostCard {...post} />
          </motion.div>
        ))}
      </section>

      <BottomNav />
    </div>
  );
};

export default Home;
