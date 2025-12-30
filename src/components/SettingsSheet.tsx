import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Clock,
  Shield,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Moon,
  User,
  Heart,
  Sun,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Initialize from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "See you next time!",
    });
    navigate("/auth");
    onOpenChange(false);
  };

  const handleNavigation = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const settingsItems = [
    { icon: Bookmark, label: "Saved", description: "View your saved posts", path: "/saved" },
    { icon: Clock, label: "Your Activity", description: "Time spent, interactions", path: "/activity" },
    { icon: Heart, label: "Liked Posts", description: "Posts you've liked", path: "/liked" },
    { icon: Bell, label: "Notifications", description: "Notification settings", path: null },
    { icon: Lock, label: "Privacy", description: "Privacy policy", path: "/privacy" },
    { icon: Shield, label: "Security", description: "Password, login activity", path: null },
    { icon: User, label: "Account", description: "Personal information", path: "/account" },
    { icon: HelpCircle, label: "Help", description: "Help center, contact us", path: "/help" },
    { icon: Info, label: "About", description: "App version, terms", path: "/about" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {/* Dark Mode Toggle */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          {/* Settings Items */}
          {settingsItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.path ? handleNavigation(item.path) : toast({ title: item.label, description: "Coming soon!" })}
              className="w-full px-4 py-3 flex items-center justify-between border-b border-border hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;