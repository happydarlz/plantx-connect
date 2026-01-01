import { ArrowLeft, Leaf, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import PlantXLogo from "@/components/PlantXLogo";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">About</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center py-8">
          <PlantXLogo size="lg" />
          <p className="text-muted-foreground mt-4">Version 1.0.0</p>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border space-y-4">
          <h2 className="font-semibold text-foreground">About PlantX</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            PlantX is a community platform for plant enthusiasts and nurseries. 
            Connect with fellow plant lovers, discover new varieties, and grow your 
            collection with our vibrant community.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate("/privacy")}
            className="w-full p-4 bg-card rounded-xl border border-border flex items-center justify-between"
          >
            <span className="text-foreground">Privacy Policy</span>
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/terms")}
            className="w-full p-4 bg-card rounded-xl border border-border flex items-center justify-between"
          >
            <span className="text-foreground">Terms of Service</span>
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/licenses")}
            className="w-full p-4 bg-card rounded-xl border border-border flex items-center justify-between"
          >
            <span className="text-foreground">Licenses</span>
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
            <Leaf className="w-4 h-4" />
            <span>Made with love by Finitix</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">© 2025 PlantX. All rights reserved.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AboutPage;