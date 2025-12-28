import { useState, useEffect } from "react";
import { MapPin, Loader2, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
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

  const [nurseryName, setNurseryName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNurseryName(profile.nursery_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAddress(profile.address || "");
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

          {/* Address Section - Manual Entry Only */}
          <div className="space-y-3 p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Address</span>
            </div>
            
            <Input
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11 rounded-xl bg-background"
            />
            
            <p className="text-xs text-muted-foreground">
              Enter your nursery address so visitors can find you
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
