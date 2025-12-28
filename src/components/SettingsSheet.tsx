import { useState } from "react";
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

const settingsItems = [
  { icon: Bookmark, label: "Saved", description: "View your saved posts" },
  { icon: Clock, label: "Your Activity", description: "Time spent, interactions" },
  { icon: Heart, label: "Liked Posts", description: "Posts you've liked" },
  { icon: Bell, label: "Notifications", description: "Push, email, SMS" },
  { icon: Lock, label: "Privacy", description: "Account privacy settings" },
  { icon: Shield, label: "Security", description: "Password, login activity" },
  { icon: User, label: "Account", description: "Personal information" },
  { icon: HelpCircle, label: "Help", description: "Help center, contact us" },
  { icon: Info, label: "About", description: "App version, terms" },
];

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "See you next time! 🌱",
    });
    navigate("/auth");
    onOpenChange(false);
  };

  const handleItemClick = (label: string) => {
    toast({
      title: label,
      description: "This feature is coming soon!",
    });
  };

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
              <Moon className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          {/* Settings Items */}
          {settingsItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleItemClick(item.label)}
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
