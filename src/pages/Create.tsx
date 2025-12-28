import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Video, Leaf, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type CreateType = "plant" | "post" | "reel" | null;

const createOptions = [
  {
    id: "plant" as CreateType,
    icon: Leaf,
    title: "Add Plant",
    description: "List a plant for sale",
    color: "bg-primary",
  },
  {
    id: "post" as CreateType,
    icon: ImagePlus,
    title: "Create Post",
    description: "Share with your followers",
    color: "bg-plantx-soft",
  },
  {
    id: "reel" as CreateType,
    icon: Video,
    title: "Create Reel",
    description: "Share a short video",
    color: "bg-accent",
  },
];

const Create = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<CreateType>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Plant form
  const [plantName, setPlantName] = useState("");
  const [plantDescription, setPlantDescription] = useState("");
  const [plantHeight, setPlantHeight] = useState("");
  const [plantSize, setPlantSize] = useState("");
  const [plantPrice, setPlantPrice] = useState("");
  const [plantTags, setPlantTags] = useState("");

  // Post/Reel form
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Published! 🌱",
        description: `Your ${selected} has been shared successfully`,
      });
      navigate("/home");
    }, 1500);
  };

  const handleBack = () => {
    if (selected) {
      setSelected(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 px-4 py-4 border-b border-border flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2">
          <X className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          {selected
            ? selected === "plant"
              ? "Add Plant"
              : selected === "post"
              ? "Create Post"
              : "Create Reel"
            : "Create"}
        </h1>
        <div className="w-10" />
      </header>

      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6 space-y-4"
          >
            <p className="text-muted-foreground text-center mb-6">
              What would you like to create?
            </p>
            {createOptions.map((option, index) => (
              <motion.button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className="w-full p-4 rounded-2xl bg-card plantx-shadow flex items-center gap-4 text-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-14 h-14 ${option.color} rounded-xl flex items-center justify-center`}>
                  <option.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : selected === "plant" ? (
          <motion.div
            key="plant-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-4 py-6 space-y-4"
          >
            {/* Image upload */}
            <div className="aspect-square bg-secondary rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
              <Camera className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Tap to add plant photo</p>
            </div>

            <Input
              placeholder="Plant Name *"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Textarea
              placeholder="Description"
              value={plantDescription}
              onChange={(e) => setPlantDescription(e.target.value)}
              className="rounded-xl"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Height (e.g., 2-3 ft)"
                value={plantHeight}
                onChange={(e) => setPlantHeight(e.target.value)}
                className="h-12 rounded-xl"
              />
              <Input
                placeholder="Size (S/M/L)"
                value={plantSize}
                onChange={(e) => setPlantSize(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Input
              placeholder="Price (optional)"
              value={plantPrice}
              onChange={(e) => setPlantPrice(e.target.value)}
              className="h-12 rounded-xl"
              type="number"
            />
            <Input
              placeholder="Tags (comma separated)"
              value={plantTags}
              onChange={(e) => setPlantTags(e.target.value)}
              className="h-12 rounded-xl"
            />

            <Button
              onClick={handleSubmit}
              disabled={!plantName || isLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 mt-4"
            >
              {isLoading ? "Publishing..." : "Publish Plant"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="post-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-4 py-6 space-y-4"
          >
            {/* Media upload */}
            <div className="aspect-video bg-secondary rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
              <Upload className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Tap to add {selected === "post" ? "image" : "video"}
              </p>
            </div>

            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="rounded-xl"
              rows={4}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-12 rounded-xl"
            />

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 mt-4"
            >
              {isLoading ? "Publishing..." : `Publish ${selected === "post" ? "Post" : "Reel"}`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Create;
