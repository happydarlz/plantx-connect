import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoryData {
  id: string;
  image_url: string;
  created_at: string;
  user_id: string;
  caption?: string | null;
}

interface StoryViewerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userImage: string;
  isOwn?: boolean;
}

const StoryViewer = ({ open, onClose, userId, userName, userImage, isOwn }: StoryViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStory, setShowAddStory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && userId) {
      fetchStories();
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [open, userId]);

  useEffect(() => {
    if (stories.length > 0 && open) {
      setProgress(0);
      if (progressRef.current) clearInterval(progressRef.current);
      
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, stories.length, open]);

  const fetchStories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (!error && data) {
      setStories(data);
      if (data.length === 0 && isOwn) {
        setShowAddStory(true);
      }
    }
    setIsLoading(false);
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadStory = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/stories/${fileName}`;

      // Compress image for faster upload if it's large
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, selectedFile, { 
          cacheControl: '3600',
          upsert: false 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(filePath);

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption || null,
      });

      if (error) throw error;

      toast({ title: "Story added! ✨" });
      setShowAddStory(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      fetchStories();
    } catch (error) {
      toast({ title: "Failed to add story", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    return `${hours}h ago`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bars */}
          {stories.length > 0 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
              {stories.map((_, index) => (
                <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{userName}</p>
                {stories[currentIndex] && (
                  <p className="text-white/70 text-xs">{formatTime(stories[currentIndex].created_at)}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center relative">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : previewUrl && isOwn ? (
              // Preview mode with caption input
              <div className="w-full h-full flex flex-col">
                <img src={previewUrl} alt="Preview" className="flex-1 object-contain" />
                <div className="absolute bottom-20 left-4 right-4">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white placeholder-white/70 text-sm outline-none"
                    maxLength={100}
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                  <button
                    onClick={cancelUpload}
                    className="flex-1 py-3 bg-white/20 rounded-full text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadStory}
                    disabled={uploading}
                    className="flex-1 py-3 bg-white rounded-full text-black text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share Story"}
                  </button>
                </div>
              </div>
            ) : showAddStory || stories.length === 0 ? (
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-dashed border-white/30">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-white text-center">Add your first story</p>
              </label>
            ) : (
              <>
                <img
                  src={stories[currentIndex]?.image_url}
                  alt=""
                  className="w-full h-full object-contain"
                />
                {/* Caption display */}
                {stories[currentIndex]?.caption && (
                  <div className="absolute bottom-16 left-4 right-4 text-center">
                    <p className="text-white text-sm bg-black/40 px-4 py-2 rounded-full inline-block backdrop-blur-sm">
                      {stories[currentIndex].caption}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation */}
          {stories.length > 0 && (
            <>
              <button
                onClick={prevStory}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3"
              />
              <button
                onClick={nextStory}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3"
              />
            </>
          )}

          {/* Add more story button for own stories */}
          {isOwn && stories.length > 0 && !previewUrl && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <label className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full cursor-pointer backdrop-blur-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Add Story</span>
              </label>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
