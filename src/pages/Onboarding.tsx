import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, ArrowRight, ArrowLeft, Check, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PlantXLogo from "@/components/PlantXLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { id: 1, title: "Profile Photo", subtitle: "Let others see your nursery" },
  { id: 2, title: "Nursery Details", subtitle: "Tell us about your nursery" },
  { id: 3, title: "Location", subtitle: "Where can customers find you?" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [nurseryName, setNurseryName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Redirect if already has profile
  useEffect(() => {
    if (profile) {
      navigate("/home");
    }
  }, [profile, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImagePreview(reader.result as string);
      };
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

    // Use watchPosition for more accurate GPS reading
    let watchId: number;
    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    const processPosition = async (position: GeolocationPosition) => {
      attempts++;
      
      // Keep the best (most accurate) position
      if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
        bestPosition = position;
      }

      console.log(`Location attempt ${attempts}:`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      // Use position if accuracy is good enough (< 100m) or we've tried enough times
      if (position.coords.accuracy < 100 || attempts >= maxAttempts) {
        navigator.geolocation.clearWatch(watchId);
        
        const finalPosition = bestPosition!;
        const { latitude: lat, longitude: lng, accuracy } = finalPosition.coords;
        
        setLatitude(lat);
        setLongitude(lng);

        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        
        toast({
          title: "Location detected!",
          description: `Accuracy: ${Math.round(accuracy)}m`,
        });
        setIsGettingLocation(false);
      }
    };

    watchId = navigator.geolocation.watchPosition(
      processPosition,
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
        
        let message = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Don't use cached position
      }
    );

    // Timeout fallback - use best position we have after 10 seconds
    setTimeout(() => {
      if (isGettingLocation && bestPosition) {
        navigator.geolocation.clearWatch(watchId);
        processPosition(bestPosition);
      }
    }, 10000);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const checkUsernameAvailable = async (username: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    return !data;
  };

  const handleComplete = async () => {
    if (!nurseryName || !username) {
      toast({
        title: "Missing information",
        description: "Please fill in your nursery name and username",
        variant: "destructive",
      });
      setCurrentStep(2);
      return;
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in again",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      // Check if username is available
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        toast({
          title: "Username taken",
          description: "Please choose a different username",
          variant: "destructive",
        });
        setCurrentStep(2);
        setIsLoading(false);
        return;
      }

      let profileImageUrl = null;

      // Upload profile image if exists
      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop();
        const filePath = `${user.id}/profile.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, profileImage, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("uploads")
            .getPublicUrl(filePath);
          profileImageUrl = publicUrl;
        }
      }

      // Create profile with location
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        nursery_name: nurseryName,
        username: username.toLowerCase().replace(/\s/g, ""),
        bio,
        address,
        latitude,
        longitude,
        profile_image: profileImageUrl,
      });

      if (error) {
        console.error("Profile creation error:", error);
        toast({
          title: "Error",
          description: "Failed to create profile. Please try again.",
          variant: "destructive",
        });
      } else {
        await refreshProfile();
        toast({
          title: "Welcome to PlantX! 🌱",
          description: "Your nursery profile is ready",
        });
        navigate("/home");
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Image is optional
      case 2:
        return nurseryName && username;
      case 3:
        return true; // Address is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <PlantXLogo size="sm" />
        
        {/* Progress */}
        <div className="flex gap-2 mt-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-1 rounded-full transition-all ${
                step.id <= currentStep ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step info */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">
            {steps[currentStep - 1].title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {steps[currentStep - 1].subtitle}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              </label>
              <p className="text-sm text-muted-foreground mt-4">
                Tap to upload your nursery photo
              </p>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Nursery Name *
                </label>
                <Input
                  placeholder="e.g., Green Paradise Nursery"
                  value={nurseryName}
                  onChange={(e) => setNurseryName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Username *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    placeholder="greenparadise"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    className="h-12 rounded-xl pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Bio / Tagline
                </label>
                <Textarea
                  placeholder="Tell customers about your nursery..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Auto-detect location button */}
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Use my current location
                  </>
                )}
              </Button>

              {latitude && longitude && (
                <div className="p-3 bg-primary/10 rounded-xl flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Location detected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">or enter manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    placeholder="Enter your nursery address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-xl resize-none pl-12"
                    rows={3}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your location helps customers find your nursery on Google Maps
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 space-y-3">
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {isLoading ? (
            <motion.div
              className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : currentStep === 3 ? (
            <>
              Complete Setup
              <Check className="ml-2 w-5 h-5" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>

        {currentStep > 1 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="w-full h-12 rounded-xl text-muted-foreground"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
