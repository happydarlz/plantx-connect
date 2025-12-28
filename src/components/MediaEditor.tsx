import { useState, useRef, useEffect } from "react";
import { X, Type, Music, Smile, Wand2, Check, Move, Play, Pause, Search, Scissors, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  isGif?: boolean;
  gifUrl?: string;
}

interface Filter {
  name: string;
  style: React.CSSProperties;
}

interface MediaEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  mediaType: "image" | "video";
  onSave: (editedData: EditedMediaData) => void;
}

export interface EditedMediaData {
  filter: string;
  filterStyle: React.CSSProperties;
  textOverlays: TextOverlay[];
  stickerOverlays: StickerOverlay[];
  selectedMusic: MusicTrack | null;
  trimStart?: number;
  trimEnd?: number;
}

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  url: string;
  previewUrl: string;
}

interface GiphyGif {
  id: string;
  title: string;
  url: string;
  preview: string;
}

const filters: Filter[] = [
  { name: "Normal", style: {} },
  { name: "Clarendon", style: { filter: "contrast(1.2) saturate(1.35)" } },
  { name: "Gingham", style: { filter: "brightness(1.05) hue-rotate(-10deg)" } },
  { name: "Moon", style: { filter: "grayscale(1) contrast(1.1) brightness(1.1)" } },
  { name: "Lark", style: { filter: "contrast(0.9) brightness(1.1) saturate(1.2)" } },
  { name: "Reyes", style: { filter: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" } },
  { name: "Juno", style: { filter: "contrast(1.15) saturate(1.8) sepia(0.1)" } },
  { name: "Slumber", style: { filter: "saturate(0.66) brightness(1.05) sepia(0.1)" } },
  { name: "Crema", style: { filter: "sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)" } },
  { name: "Ludwig", style: { filter: "contrast(1.05) saturate(1.3) brightness(0.95)" } },
  { name: "Aden", style: { filter: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)" } },
  { name: "Perpetua", style: { filter: "contrast(1.1) brightness(1.25) saturate(1.1)" } },
];

// Sample music with preview URLs (royalty-free audio samples)
const musicTracks: MusicTrack[] = [
  { id: "1", name: "Chill Vibes", artist: "Lo-Fi Beats", duration: "2:34", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", name: "Summer Breeze", artist: "Tropical House", duration: "3:12", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "3", name: "Urban Flow", artist: "Hip Hop Instrumental", duration: "2:45", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "4", name: "Acoustic Morning", artist: "Guitar Melodies", duration: "3:01", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "5", name: "Electric Dreams", artist: "Synthwave", duration: "2:58", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "6", name: "Jazz Cafe", artist: "Smooth Jazz", duration: "3:24", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: "7", name: "Nature Sounds", artist: "Ambient", duration: "4:00", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: "8", name: "Pop Energy", artist: "Upbeat Pop", duration: "2:30", url: "", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

const emojiStickers = [
  "🌱", "🌿", "🌸", "🌺", "🌻", "🌼", "🌷", "💐", "🪴", "🌳",
  "🍀", "🌾", "🌵", "🌴", "🎋", "🎍", "🍃", "🍂", "🍁", "🌲",
  "💚", "💛", "🧡", "💜", "💙", "❤️", "🖤", "🤍", "💕", "✨",
  "⭐", "🌟", "💫", "🔥", "🦋", "🐝", "🐞", "🌈", "☀️", "🌙",
  "😍", "🥰", "😊", "🤩", "😎", "🥳", "💯", "👏", "🙌", "💪",
];

const textColors = [
  "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FF6B6B", "#4ECDC4",
  "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8",
];

const fontFamilies = [
  "Inter", "Georgia", "Impact", "Comic Sans MS", "Courier New",
];

// Giphy public beta API key (for development/demo purposes)
const GIPHY_API_KEY = "dc6zaTOxFJmzC";

const MediaEditor = ({ open, onOpenChange, mediaUrl, mediaType, onSave }: MediaEditorProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("filters");
  const [selectedFilter, setSelectedFilter] = useState<Filter>(filters[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  
  // Text editing states
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState([24]);
  const [fontFamily, setFontFamily] = useState("Inter");
  
  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<"text" | "sticker" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Audio playback state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // GIF search state
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [stickerTab, setStickerTab] = useState<"emoji" | "gif">("emoji");
  
  // Video trimming state
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Load trending GIFs on mount
  useEffect(() => {
    if (stickerTab === "gif" && gifs.length === 0) {
      fetchTrendingGifs();
    }
  }, [stickerTab]);

  // Get video duration
  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      const handleLoadedMetadata = () => {
        setVideoDuration(videoRef.current?.duration || 0);
        setTrimEnd([100]);
      };
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [mediaType, mediaUrl]);

  const fetchTrendingGifs = async () => {
    setIsLoadingGifs(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      const formattedGifs: GiphyGif[] = data.data.map((gif: any) => ({
        id: gif.id,
        title: gif.title,
        url: gif.images.fixed_height.url,
        preview: gif.images.fixed_height_small.url,
      }));
      setGifs(formattedGifs);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const searchGifs = async () => {
    if (!gifSearch.trim()) {
      fetchTrendingGifs();
      return;
    }
    
    setIsLoadingGifs(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch)}&limit=20&rating=g`
      );
      const data = await response.json();
      const formattedGifs: GiphyGif[] = data.data.map((gif: any) => ({
        id: gif.id,
        title: gif.title,
        url: gif.images.fixed_height.url,
        preview: gif.images.fixed_height_small.url,
      }));
      setGifs(formattedGifs);
    } catch (error) {
      console.error("Error searching GIFs:", error);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const handlePlayPreview = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingTrackId(null);
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Start new audio
      const audio = new Audio(track.previewUrl);
      audio.volume = 0.5;
      audio.play().catch(() => {
        toast({ title: "Couldn't play preview", variant: "destructive" });
      });
      
      audio.onended = () => {
        setPlayingTrackId(null);
        audioRef.current = null;
      };
      
      audioRef.current = audio;
      setPlayingTrackId(track.id);
    }
  };

  const handleAddText = () => {
    if (!newText.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: 50,
      y: 50,
      fontSize: fontSize[0],
      color: textColor,
      fontFamily,
    };
    
    setTextOverlays([...textOverlays, newOverlay]);
    setNewText("");
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50,
      size: 48,
      isGif: false,
    };
    setStickerOverlays([...stickerOverlays, newSticker]);
  };

  const handleAddGifSticker = (gif: GiphyGif) => {
    const newSticker: StickerOverlay = {
      id: Date.now().toString(),
      emoji: "",
      x: 50,
      y: 50,
      size: 80,
      isGif: true,
      gifUrl: gif.url,
    };
    setStickerOverlays([...stickerOverlays, newSticker]);
    toast({ title: "GIF added!" });
  };

  const handleRemoveText = (id: string) => {
    setTextOverlays(textOverlays.filter((t) => t.id !== id));
  };

  const handleRemoveSticker = (id: string) => {
    setStickerOverlays(stickerOverlays.filter((s) => s.id !== id));
  };

  const handleTouchStart = (id: string, type: "text" | "sticker") => (e: React.TouchEvent) => {
    e.preventDefault();
    setDraggingId(id);
    setDraggingType(type);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));
    
    if (draggingType === "text") {
      setTextOverlays(textOverlays.map((t) => 
        t.id === draggingId ? { ...t, x: clampedX, y: clampedY } : t
      ));
    } else {
      setStickerOverlays(stickerOverlays.map((s) => 
        s.id === draggingId ? { ...s, x: clampedX, y: clampedY } : s
      ));
    }
  };

  const handleTouchEnd = () => {
    setDraggingId(null);
    setDraggingType(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingTrackId(null);
    
    onSave({
      filter: selectedFilter.name,
      filterStyle: selectedFilter.style,
      textOverlays,
      stickerOverlays,
      selectedMusic,
      trimStart: mediaType === "video" ? (trimStart[0] / 100) * videoDuration : undefined,
      trimEnd: mediaType === "video" ? (trimEnd[0] / 100) * videoDuration : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl px-0">
        <SheetHeader className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <button onClick={() => onOpenChange(false)} className="p-1">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <SheetTitle>Edit Media</SheetTitle>
            <Button size="sm" onClick={handleSave} className="h-8 px-4 rounded-full">
              <Check className="w-4 h-4 mr-1" />
              Done
            </Button>
          </div>
        </SheetHeader>

        {/* Preview Area */}
        <div 
          ref={containerRef}
          className="relative aspect-square mx-4 rounded-2xl overflow-hidden bg-black"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {mediaType === "image" ? (
            <img 
              src={mediaUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              style={selectedFilter.style}
            />
          ) : (
            <video 
              ref={videoRef}
              src={mediaUrl} 
              className="w-full h-full object-cover"
              style={selectedFilter.style}
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          
          {/* Text Overlays */}
          {textOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: "translate(-50%, -50%)",
                fontSize: `${overlay.fontSize}px`,
                color: overlay.color,
                fontFamily: overlay.fontFamily,
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                fontWeight: "bold",
              }}
              onTouchStart={handleTouchStart(overlay.id, "text")}
            >
              <div className="relative group">
                <span className="whitespace-nowrap">{overlay.text}</span>
                <button
                  onClick={() => handleRemoveText(overlay.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-70"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Sticker Overlays */}
          {stickerOverlays.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onTouchStart={handleTouchStart(sticker.id, "sticker")}
            >
              <div className="relative group">
                {sticker.isGif ? (
                  <img 
                    src={sticker.gifUrl} 
                    alt="GIF sticker" 
                    className="rounded-lg"
                    style={{ width: `${sticker.size}px`, height: "auto" }}
                  />
                ) : (
                  <span style={{ fontSize: `${sticker.size}px` }}>{sticker.emoji}</span>
                )}
                <button
                  onClick={() => handleRemoveSticker(sticker.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-70"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Drag indicator */}
          {draggingId && (
            <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 rounded-2xl">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Move className="w-3 h-3" />
                Drag to position
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex-1 mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid grid-cols-5 mx-4 mb-3">
              <TabsTrigger value="filters" className="gap-1 text-xs px-2">
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1 text-xs px-2">
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="music" className="gap-1 text-xs px-2">
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Music</span>
              </TabsTrigger>
              <TabsTrigger value="stickers" className="gap-1 text-xs px-2">
                <Smile className="w-4 h-4" />
                <span className="hidden sm:inline">Stickers</span>
              </TabsTrigger>
              {mediaType === "video" && (
                <TabsTrigger value="trim" className="gap-1 text-xs px-2">
                  <Scissors className="w-4 h-4" />
                  <span className="hidden sm:inline">Trim</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="px-4 overflow-y-auto max-h-[35vh]">
              {/* Filters Tab */}
              <TabsContent value="filters" className="mt-0">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setSelectedFilter(filter)}
                      className={`flex-shrink-0 text-center ${
                        selectedFilter.name === filter.name ? "ring-2 ring-primary rounded-xl" : ""
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden mb-1">
                        {mediaType === "image" ? (
                          <img 
                            src={mediaUrl} 
                            alt={filter.name} 
                            className="w-full h-full object-cover"
                            style={filter.style}
                          />
                        ) : (
                          <div 
                            className="w-full h-full bg-gradient-to-br from-primary to-accent"
                            style={filter.style}
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{filter.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="mt-0 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter text..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="h-10 rounded-xl flex-1"
                  />
                  <Button onClick={handleAddText} disabled={!newText.trim()} className="h-10 px-4 rounded-xl">
                    Add
                  </Button>
                </div>
                
                {/* Color picker */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Text Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {textColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          textColor === color ? "border-primary scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Font size */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Font Size: {fontSize[0]}px</p>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    min={12}
                    max={72}
                    step={2}
                    className="w-full"
                  />
                </div>
                
                {/* Font family */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Font Style</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {fontFamilies.map((font) => (
                      <button
                        key={font}
                        onClick={() => setFontFamily(font)}
                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                          fontFamily === font 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-muted-foreground"
                        }`}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Music Tab */}
              <TabsContent value="music" className="mt-0">
                <div className="space-y-2">
                  {selectedMusic && (
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl mb-3">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handlePlayPreview(selectedMusic)}
                          className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
                        >
                          {playingTrackId === selectedMusic.id ? (
                            <Pause className="w-5 h-5 text-primary-foreground" />
                          ) : (
                            <Play className="w-5 h-5 text-primary-foreground" />
                          )}
                        </button>
                        <div>
                          <p className="font-medium text-sm">{selectedMusic.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedMusic.artist}</p>
                        </div>
                      </div>
                      <button onClick={() => {
                        if (playingTrackId === selectedMusic.id && audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current = null;
                          setPlayingTrackId(null);
                        }
                        setSelectedMusic(null);
                      }}>
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  
                  {musicTracks.map((track) => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedMusic?.id === track.id 
                          ? "bg-primary/10 border border-primary" 
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {/* Play/Pause button */}
                      <button 
                        onClick={() => handlePlayPreview(track)}
                        className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        {playingTrackId === track.id ? (
                          <Pause className="w-5 h-5 text-foreground" />
                        ) : (
                          <Play className="w-5 h-5 text-foreground" />
                        )}
                      </button>
                      
                      {/* Track info - clickable to select */}
                      <button 
                        onClick={() => setSelectedMusic(track)}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium text-sm">{track.name}</p>
                        <p className="text-xs text-muted-foreground">{track.artist}</p>
                      </button>
                      
                      <span className="text-xs text-muted-foreground">{track.duration}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Stickers Tab */}
              <TabsContent value="stickers" className="mt-0">
                {/* Sticker type toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setStickerTab("emoji")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      stickerTab === "emoji" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    😊 Emoji
                  </button>
                  <button
                    onClick={() => setStickerTab("gif")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      stickerTab === "gif" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    🎬 GIFs
                  </button>
                </div>

                {stickerTab === "emoji" ? (
                  <div className="grid grid-cols-8 gap-2">
                    {emojiStickers.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddSticker(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-secondary rounded-lg transition-colors active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* GIF Search */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search GIFs..."
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchGifs()}
                        className="h-10 rounded-xl flex-1"
                      />
                      <Button onClick={searchGifs} className="h-10 px-4 rounded-xl">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* GIF Grid */}
                    {isLoadingGifs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {gifs.map((gif) => (
                          <button
                            key={gif.id}
                            onClick={() => handleAddGifSticker(gif)}
                            className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                          >
                            <img 
                              src={gif.preview} 
                              alt={gif.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Powered by GIPHY
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Trim Tab (Video only) */}
              {mediaType === "video" && (
                <TabsContent value="trim" className="mt-0 space-y-4">
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Scissors className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">Trim Video</h3>
                    </div>
                    
                    {/* Start time slider */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Start</span>
                        <span className="font-medium">{formatTime((trimStart[0] / 100) * videoDuration)}</span>
                      </div>
                      <Slider
                        value={trimStart}
                        onValueChange={(val) => {
                          if (val[0] < trimEnd[0] - 5) {
                            setTrimStart(val);
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* End time slider */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">End</span>
                        <span className="font-medium">{formatTime((trimEnd[0] / 100) * videoDuration)}</span>
                      </div>
                      <Slider
                        value={trimEnd}
                        onValueChange={(val) => {
                          if (val[0] > trimStart[0] + 5) {
                            setTrimEnd(val);
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Duration info */}
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Selected duration</span>
                      <span className="font-medium text-primary">
                        {formatTime(((trimEnd[0] - trimStart[0]) / 100) * videoDuration)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Drag the sliders to select the portion of video you want to keep
                  </p>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MediaEditor;
