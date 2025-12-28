import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Video, Leaf, Camera, Upload, Loader2, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type CreateType = "plant" | "post" | "reel" | "story" | null;

const createOptions = [
  {
    id: "plant" as CreateType,
    icon: Leaf,
    title: "Add Plant",
    description: "List a plant for others",
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
    id: "story" as CreateType,
    icon: Camera,
    title: "Add Story",
    description: "Share a 24-hour story",
    color: "bg-accent",
  },
  {
    id: "reel" as CreateType,
    icon: Video,
    title: "Create Reel",
    description: "Share a short video",
    color: "bg-orange-500",
  },
];

const Create = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selected, setSelected] = useState<CreateType>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Multiple images support
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Plant form
  const [plantName, setPlantName] = useState("");
  const [plantDescription, setPlantDescription] = useState("");
  const [plantHeight, setPlantHeight] = useState("");
  const [plantSize, setPlantSize] = useState("");
  const [plantTags, setPlantTags] = useState("");

  // Post/Reel form
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files].slice(0, 10); // Max 10 images
    setImageFiles(newFiles);

    // Generate previews
    const previews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === newFiles.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (folder: string): Promise<string[]> => {
    if (!imageFiles.length || !user) return [];

    const urls: string[] = [];
    for (const file of imageFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error } = await supabase.storage.from("uploads").upload(filePath, file);

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("uploads").getPublicUrl(filePath);
        urls.push(publicUrl);
      }
    }
    return urls;
  };

  const handleSubmitPlant = async () => {
    if (!plantName) {
      toast({ title: "Plant name is required", variant: "destructive" });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      const imageUrls = await uploadImages("plants");

      const { error } = await supabase.from("plants").insert({
        user_id: user.id,
        name: plantName,
        description: plantDescription || null,
        height: plantHeight || null,
        size: plantSize || null,
        tags: plantTags ? plantTags.split(",").map((t) => t.trim()) : [],
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
      });

      if (error) throw error;

      toast({ title: "Plant added! 🌱", description: "Your plant is now listed" });
      navigate("/profile");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to add plant", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPost = async () => {
    if (!imageFiles.length) {
      toast({ title: "Image is required", variant: "destructive" });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      const imageUrls = await uploadImages("posts");

      if (!imageUrls.length) {
        throw new Error("Failed to upload images");
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        image_url: imageUrls[0],
        image_urls: imageUrls,
        caption: caption || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });

      if (error) throw error;

      toast({ title: "Posted! 🌿", description: "Your post is live" });
      navigate("/home");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStory = async () => {
    if (!imageFiles.length) {
      toast({ title: "Image is required", variant: "destructive" });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      const imageUrls = await uploadImages("stories");

      if (!imageUrls.length) {
        throw new Error("Failed to upload image");
      }

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        image_url: imageUrls[0],
      });

      if (error) throw error;

      toast({ title: "Story added! ✨", description: "Visible for 24 hours" });
      navigate("/home");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create story", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReel = async () => {
    if (!imageFiles.length) {
      toast({ title: "Video is required", variant: "destructive" });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      const videoUrls = await uploadImages("reels");

      if (!videoUrls.length) {
        throw new Error("Failed to upload video");
      }

      const { error } = await supabase.from("reels").insert({
        user_id: user.id,
        video_url: videoUrls[0],
        caption: caption || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });

      if (error) throw error;

      toast({ title: "Reel posted! 🎬", description: "Your reel is now live" });
      navigate("/reels");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create reel", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selected === "plant") {
      handleSubmitPlant();
    } else if (selected === "post") {
      handleSubmitPost();
    } else if (selected === "story") {
      handleSubmitStory();
    } else if (selected === "reel") {
      handleSubmitReel();
    }
  };

  const handleBack = () => {
    if (selected) {
      setSelected(null);
      setImageFiles([]);
      setImagePreviews([]);
      setPlantName("");
      setPlantDescription("");
      setPlantHeight("");
      setPlantSize("");
      setPlantTags("");
      setCaption("");
      setTags("");
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
              : selected === "story"
              ? "Add Story"
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
            <p className="text-muted-foreground text-center mb-6">What would you like to create?</p>
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
            {/* Multiple image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Photos (up to 10)</label>
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 10 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </label>
                )}
              </div>
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
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Plant"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="media-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-4 py-6 space-y-4"
          >
            {/* Media upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {selected === "reel" ? "Video" : selected === "post" ? "Photos (up to 10)" : "Photo"}
              </label>
              {selected === "post" ? (
                <div className="flex gap-2 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 10 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </label>
                  )}
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept={selected === "reel" ? "video/*" : "image/*"}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="aspect-video bg-secondary rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden">
                    {imagePreviews[0] ? (
                      selected === "reel" ? (
                        <video src={imagePreviews[0]} className="w-full h-full object-cover" />
                      ) : (
                        <img src={imagePreviews[0]} alt="Preview" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">
                          Tap to add {selected === "reel" ? "video" : "image"}
                        </p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            {selected !== "story" && (
              <>
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
              </>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !imageFiles.length}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Publish ${selected === "post" ? "Post" : selected === "story" ? "Story" : "Reel"}`
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Create;
