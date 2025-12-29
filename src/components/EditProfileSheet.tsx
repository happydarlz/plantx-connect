import { useState, useEffect } from "react";
import { MapPin, Loader2, Link as LinkIcon, Plus, Trash2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ProfileLink {
  title: string;
  url: string;
}

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileSheet = ({ open, onOpenChange }: EditProfileSheetProps) => {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [nurseryName, setNurseryName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNurseryName(profile.nursery_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAddress(profile.address || "");
      setLatitude((profile as any).latitude || null);
      setLongitude((profile as any).longitude || null);
      try {
        const links = (profile as any).profile_links || [];
        setProfileLinks(Array.isArray(links) ? links : []);
      } catch {
        setProfileLinks([]);
      }
      setImagePreview(profile.profile_image);
    }
  }, [profile]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'PlantX-App' } }
      );
      const data = await response.json();
      
      if (data.address) {
        const parts = [];
        if (data.address.village || data.address.town || data.address.city) {
          parts.push(data.address.village || data.address.town || data.address.city);
        }
        if (data.address.county || data.address.state_district) {
          parts.push(data.address.county || data.address.state_district);
        }
        if (data.address.state) {
          parts.push(data.address.state);
        }
        if (data.address.country) {
          parts.push(data.address.country);
        }
        return parts.join(", ") || data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);

    // Use getCurrentPosition first for quick response
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        console.log("Location obtained:", { lat, lng, accuracy });
        
        setLatitude(lat);
        setLongitude(lng);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'PlantX-App/1.0' } }
          );
          const data = await response.json();
          
          if (data.address) {
            const parts = [];
            const addr = data.address;
            if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
            if (addr.village || addr.town || addr.city) parts.push(addr.village || addr.town || addr.city);
            if (addr.state_district || addr.county) parts.push(addr.state_district || addr.county);
            if (addr.state) parts.push(addr.state);
            setAddress(parts.length > 0 ? parts.join(", ") : data.display_name);
          } else {
            setAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch {
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        
        toast({
          title: "Location updated!",
          description: `Accuracy: ${Math.round(accuracy)}m`,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
        
        let message = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Please allow location access in your browser settings";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location unavailable. Make sure GPS is enabled.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Try moving to an open area.";
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: false, // Use low accuracy for faster response
        timeout: 5000, // Short timeout
        maximumAge: 60000, // Allow cached position up to 1 minute old
      }
    );
  };

  const addLink = () => {
    setProfileLinks([...profileLinks, { title: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    setProfileLinks(profileLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: "title" | "url", value: string) => {
    const updated = [...profileLinks];
    updated[index][field] = value;
    setProfileLinks(updated);
  };

  const handleSave = async () => {
    if (!user || !nurseryName || !username) {
      toast({ title: "Name and username are required", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      let profileImageUrl = profile?.profile_image;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/profile/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("uploads")
            .getPublicUrl(filePath);
          profileImageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          nursery_name: nurseryName,
          username: username.toLowerCase().replace(/\s/g, ""),
          bio,
          address,
          latitude,
          longitude,
          profile_image: profileImageUrl,
          profile_links: JSON.parse(JSON.stringify(profileLinks)),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Profile updated!" });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pb-4">
          {/* Profile Image */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-4 border-primary">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Add Photo
                  </div>
                )}
              </div>
            </label>
          </div>

          <Input
            placeholder="Nursery Name *"
            value={nurseryName}
            onChange={(e) => setNurseryName(e.target.value)}
            className="h-12 rounded-xl"
          />

          <Input
            placeholder="Username *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-12 rounded-xl"
          />

          <Textarea
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-xl"
            rows={3}
          />

          {/* Location Section with GPS */}
          <div className="space-y-3 p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Location</span>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Use my current location
                </>
              )}
            </Button>

            {latitude && longitude && (
              <div className="p-2 bg-primary/10 rounded-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-medium">
                  GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
            )}
            
            <Input
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11 rounded-xl bg-background"
            />
            
            <p className="text-xs text-muted-foreground">
              Location helps customers find you on Google Maps
            </p>
          </div>

          {/* Profile Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Links</span>
              <Button variant="ghost" size="sm" onClick={addLink}>
                <Plus className="w-4 h-4 mr-1" /> Add Link
              </Button>
            </div>
            {profileLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Title"
                  value={link.title}
                  onChange={(e) => updateLink(index, "title", e.target.value)}
                  className="h-10 rounded-xl flex-1"
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                  className="h-10 rounded-xl flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeLink(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading || !nurseryName || !username}
            className="w-full h-12 rounded-xl mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditProfileSheet;
