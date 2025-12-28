import { useState } from "react";
import { Home, Search, Film, User, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CreateSheet from "./CreateSheet";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "create", icon: Plus, label: "Create", isCenter: true },
  { path: "/reels", icon: Film, label: "Reels" },
  { path: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <motion.button
                  key={item.path}
                  onClick={() => setCreateOpen(true)}
                  className="relative -mt-6"
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-1 py-2 px-4"
                whileTap={{ scale: 0.9 }}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
      
      <CreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
};

export default BottomNav;
