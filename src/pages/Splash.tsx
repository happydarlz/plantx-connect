import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PlantXLogo from "@/components/PlantXLogo";
import { useAuth } from "@/contexts/AuthContext";

const Splash = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (user) {
        if (profile) {
          navigate("/home");
        } else {
          navigate("/onboarding");
        }
      } else {
        navigate("/auth");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, profile, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-plantx-soft/20 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      />
      <motion.div
        className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />

      {/* Animated leaf decorations */}
      <motion.div
        className="absolute top-32 right-16"
        initial={{ opacity: 0, y: -20, rotate: -45 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <svg className="w-8 h-8 text-plantx-soft" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-48 left-12"
        initial={{ opacity: 0, y: 20, rotate: 45 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        <svg className="w-6 h-6 text-primary/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>
      </motion.div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-6 z-10">
        <PlantXLogo size="xl" animated showTagline />
        
        {/* Loading indicator */}
        <motion.div
          className="flex gap-1.5 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <p className="text-muted-foreground text-sm font-light">From Finitix</p>
      </motion.footer>
    </div>
  );
};

export default Splash;
