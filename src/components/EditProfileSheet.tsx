import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Loader2, Link as LinkIcon, Plus, Trash2, Navigation } from "lucide-react";
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
  const [isLocating, setIsLocating] = useState(false);

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

  const requestLocationPermission = async () => {
    setIsLocating(true);
    
    try {
      // Request permission explicitly
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        toast({ 
          title: "Location Access Denied", 
          description: "Please enable location in your browser settings",
          variant: "destructive" 
        });
        setIsLocating(false);
        return;
      }
    } catch {
      // Permission API not supported, continue anyway
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          setLatitude(lat);
          setLongitude(lng);
          
          try {
            // Use more accurate reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            const data = await response.json();
            
            // Build a cleaner address
            const addr = data.address;
            let formattedAddress = "";
            
            if (addr) {
              const parts = [];
              if (addr.road) parts.push(addr.road);
              if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
              if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
              if (addr.state) parts.push(addr.state);
              if (addr.postcode) parts.push(addr.postcode);
              formattedAddress = parts.join(", ");
            }
            
            if (!formattedAddress) {
              formattedAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
            
            setAddress(formattedAddress);
            toast({ 
              title: "Location detected!", 
              description: `Accuracy: ${Math.round(accuracy)}m` 
            });
          } catch {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
          setIsLocating(false);
        },
        (error) => {
          let message = "Unable to get location";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied. Please enable it in browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location unavailable. Please try again.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out. Please try again.";
              break;
          }
          toast({ title: "Location Error", description: message, variant: "destructive" });
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      setIsLocating(false);
    }
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

          {/* Location Section */}
          <div className="space-y-3 p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Location</span>
            </div>
            
            <Input
              placeholder="Enter address manually"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11 rounded-xl bg-background"
            />
            
            <Button
              variant="outline"
              onClick={requestLocationPermission}
              disabled={isLocating}
              className="w-full h-11 rounded-xl"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Detecting location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Share My Current Location
                </>
              )}
            </Button>
            
            {latitude && longitude && (
              <p className="text-xs text-muted-foreground text-center">
                📍 Location saved - Visitors can open in Google Maps
              </p>
            )}
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
