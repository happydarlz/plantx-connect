import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Video, Leaf, X, Upload, Plus, Loader2, Wand2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MediaEditor, { EditedMediaData } from "./MediaEditor";

type CreateType = "plant" | "post" | "reel" | null;

interface CreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateSheet = ({ open, onOpenChange }: CreateSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [selected, setSelected] = useState<CreateType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [plantName, setPlantName] = useState("");
  const [plantDescription, setPlantDescription] = useState("");
  const [plantHeight, setPlantHeight] = useState("");
  const [plantSize, setPlantSize] = useState("");
  const [plantTags, setPlantTags] = useState("");

  const [postName, setPostName] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(0);
  const [editedMediaData, setEditedMediaData] = useState<Record<number, EditedMediaData>>({});

  const userType = (profile as any)?.user_type || "normal";
  const isNursery = userType === "nursery";

  // Filter create options based on user type
  const createOptions = [
    {
      id: "post" as CreateType,
      icon: ImagePlus,
      title: "Create Post",
      description: "Share with your followers",
      color: "bg-primary",
      available: true,
    },
    {
      id: "plant" as CreateType,
      icon: Leaf,
      title: "Add Plant",
      description: "List a plant for others",
      color: "bg-accent",
      available: isNursery,
    },
    {
      id: "reel" as CreateType,
      icon: Video,
      title: "Create Reel",
      description: "Share a short video",
      color: "bg-orange-500",
      available: true,
    },
  ].filter((option) => option.available);

  const resetForm = () => {
    setSelected(null);
    setImageFiles([]);
    setImagePreviews([]);
    setPlantName("");
    setPlantDescription("");
    setPlantHeight("");
    setPlantSize("");
    setPlantTags("");
    setPostName("");
    setCaption("");
    setTags("");
    setEditedMediaData({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(newFiles);

    const previews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === newFiles.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    const newEditedData = { ...editedMediaData };
    delete newEditedData[index];
    setEditedMediaData(newEditedData);
  };

  const openEditor = (index: number) => {
    setEditingIndex(index);
    setEditorOpen(true);
  };

  const handleEditorSave = (data: EditedMediaData) => {
    setEditedMediaData({ ...editedMediaData, [editingIndex]: data });
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
        const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(filePath);
        urls.push(publicUrl);
      }
    }
    return urls;
  };

  const handleSubmitPlant = async () => {
    if (!plantName || !user) return;
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
      toast({ title: "Plant added!" });
      handleClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add plant", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPost = async () => {
    if (!imageFiles.length || !user) return;
    setIsLoading(true);

    try {
      const imageUrls = await uploadImages("posts");

      if (!imageUrls.length) throw new Error("Failed to upload images");

      const editData = editedMediaData[0];
      let finalCaption = postName ? `${postName}${caption ? ` - ${caption}` : ""}` : caption || "";
      if (editData?.filter && editData.filter !== "Normal") {
        finalCaption = finalCaption ? `${finalCaption} • Filter: ${editData.filter}` : `Filter: ${editData.filter}`;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        image_url: imageUrls[0],
        image_urls: imageUrls,
        caption: finalCaption || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });

      if (error) throw error;
      toast({ title: "Posted!" });
      handleClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReel = async () => {
    if (!imageFiles.length || !user) return;
    setIsLoading(true);

    try {
      const videoUrls = await uploadImages("reels");

      if (!videoUrls.length) throw new Error("Failed to upload video");

      const editData = editedMediaData[0];
      let finalCaption = caption || "";
      if (editData?.filter && editData.filter !== "Normal") {
        finalCaption = finalCaption ? `${finalCaption} • Filter: ${editData.filter}` : `Filter: ${editData.filter}`;
      }
      if (editData?.selectedMusic) {
        finalCaption = finalCaption 
          ? `${finalCaption} 🎵 ${editData.selectedMusic.name}` 
          : `🎵 ${editData.selectedMusic.name}`;
      }

      const { error } = await supabase.from("reels").insert({
        user_id: user.id,
        video_url: videoUrls[0],
        caption: finalCaption || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });

      if (error) throw error;
      toast({ title: "Reel posted!" });
      handleClose();
      navigate("/reels");
    } catch (error) {
      toast({ title: "Error", description: "Failed to create reel", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selected === "plant") handleSubmitPlant();
    else if (selected === "post") handleSubmitPost();
    else if (selected === "reel") handleSubmitReel();
  };

  const hasEdits = (index: number) => {
    const data = editedMediaData[index];
    if (!data) return false;
    return (
      data.filter !== "Normal" ||
      data.textOverlays.length > 0 ||
      data.stickerOverlays.length > 0 ||
      data.selectedMusic !== null
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-4">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              {selected && (
                <button onClick={() => setSelected(null)} className="p-1">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
              <SheetTitle className="flex-1 text-center">
                {selected ? (selected === "plant" ? "Add Plant" : selected === "post" ? "Create Post" : "Create Reel") : "Create"}
              </SheetTitle>
              {selected && <div className="w-6" />}
            </div>
          </SheetHeader>

          <div className="overflow-y-auto max-h-[calc(85vh-80px)] pb-8">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {createOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      onClick={() => setSelected(option.id)}
                      className="w-full p-4 rounded-2xl bg-card border border-border flex items-center gap-4 text-left hover:border-primary/30 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center`}>
                        <option.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </motion.button>
                  ))}
                  
                  {!isNursery && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Want to list plants? Switch to a Nursery account in settings.
                    </p>
                  )}
                </motion.div>
              ) : selected === "plant" ? (
                <motion.div
                  key="plant-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Photos (up to 10)</label>
                    <div className="flex gap-2 flex-wrap">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden">
                          <img src={preview} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                      {imageFiles.length < 10 && (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer">
                          <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </label>
                      )}
                    </div>
                  </div>
                  <Input placeholder="Plant Name *" value={plantName} onChange={(e) => setPlantName(e.target.value)} className="h-11 rounded-xl" />
                  <Textarea placeholder="Description" value={plantDescription} onChange={(e) => setPlantDescription(e.target.value)} className="rounded-xl" rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Height" value={plantHeight} onChange={(e) => setPlantHeight(e.target.value)} className="h-11 rounded-xl" />
                    <Input placeholder="Size (S/M/L)" value={plantSize} onChange={(e) => setPlantSize(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <Input placeholder="Tags (comma separated)" value={plantTags} onChange={(e) => setPlantTags(e.target.value)} className="h-11 rounded-xl" />
                  <Button onClick={handleSubmit} disabled={!plantName || isLoading} className="w-full h-11 rounded-xl">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Plant"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="media-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {selected === "reel" ? "Video" : "Photos (up to 10)"}
                    </label>
                    {selected === "post" ? (
                      <div className="flex gap-2 flex-wrap">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                            <img 
                              src={preview} 
                              alt="" 
                              className="w-full h-full object-cover"
                              style={editedMediaData[index]?.filterStyle || {}}
                            />
                            <button 
                              onClick={() => openEditor(index)}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Wand2 className="w-5 h-5 text-white" />
                            </button>
                            {hasEdits(index) && (
                              <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <Wand2 className="w-2.5 h-2.5 text-primary-foreground" />
                              </div>
                            )}
                            <button 
                              onClick={() => removeImage(index)} 
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                        {imageFiles.length < 10 && (
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                            <Plus className="w-6 h-6 text-muted-foreground" />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block">
                          <input type="file" accept="video/*" onChange={handleImageSelect} className="hidden" />
                          <div className="aspect-video bg-secondary rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden relative group">
                            {imagePreviews[0] ? (
                              <>
                                <video 
                                  src={imagePreviews[0]} 
                                  className="w-full h-full object-cover"
                                  style={editedMediaData[0]?.filterStyle || {}}
                                />
                                {hasEdits(0) && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-primary/80 rounded-full flex items-center gap-1">
                                    <Wand2 className="w-3 h-3 text-primary-foreground" />
                                    <span className="text-xs text-primary-foreground font-medium">Edited</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Tap to upload video</span>
                              </>
                            )}
                          </div>
                        </label>
                        {imagePreviews[0] && (
                          <Button 
                            variant="outline" 
                            onClick={() => openEditor(0)} 
                            className="w-full rounded-xl"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Edit Video
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {selected === "post" && (
                    <Input 
                      placeholder="Post Name" 
                      value={postName} 
                      onChange={(e) => setPostName(e.target.value)} 
                      className="h-11 rounded-xl" 
                    />
                  )}
                  <Textarea 
                    placeholder="Write a caption..." 
                    value={caption} 
                    onChange={(e) => setCaption(e.target.value)} 
                    className="rounded-xl" 
                    rows={3} 
                  />
                  <Input 
                    placeholder="Tags (comma separated)" 
                    value={tags} 
                    onChange={(e) => setTags(e.target.value)} 
                    className="h-11 rounded-xl" 
                  />
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!imageFiles.length || isLoading} 
                    className="w-full h-11 rounded-xl"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : selected === "reel" ? "Post Reel" : "Share Post"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

      {imagePreviews[editingIndex] && (
        <MediaEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          mediaUrl={imagePreviews[editingIndex]}
          mediaType={selected === "reel" ? "video" : "image"}
          onSave={handleEditorSave}
        />
      )}
    </>
  );
};

export default CreateSheet;