import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PlantXLogo from "@/components/PlantXLogo";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Profile Photo", subtitle: "Let others see your nursery" },
  { id: 2, title: "Nursery Details", subtitle: "Tell us about your nursery" },
  { id: 3, title: "Location", subtitle: "Where can customers find you?" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nurseryName, setNurseryName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const handleComplete = () => {
    if (!nurseryName || !username) {
      toast({
        title: "Missing information",
        description: "Please fill in your nursery name and username",
        variant: "destructive",
      });
      setCurrentStep(2);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome to PlantX! 🌱",
        description: "Your nursery profile is ready",
      });
      navigate("/home");
    }, 1500);
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
                    {profileImage ? (
                      <img
                        src={profileImage}
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

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-primary text-primary hover:bg-plantx-light"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Select from Map
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You can update this later from your profile settings
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
