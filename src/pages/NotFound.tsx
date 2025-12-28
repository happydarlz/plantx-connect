import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlantXLogo from "@/components/PlantXLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <PlantXLogo size="md" />
        
        <div className="mt-12 mb-8">
          <motion.div
            className="text-8xl font-bold text-primary/20"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            404
          </motion.div>
          <h1 className="text-2xl font-semibold text-foreground mt-4">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            Looks like this plant hasn't sprouted yet!
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          <Button asChild className="h-12 rounded-xl">
            <Link to="/home">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl">
            <Link to="/">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Start
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
