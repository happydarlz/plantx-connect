import { motion } from "framer-motion";

interface PlantXLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-6xl",
};

const PlantXLogo = ({ size = "lg", animated = false, showTagline = false }: PlantXLogoProps) => {
  const LogoContent = (
    <div className="flex flex-col items-center gap-2">
      <div className={`font-poppins font-semibold ${sizeClasses[size]} flex items-center`}>
        <span className="text-primary">Plant</span>
        <span className="text-plantx-soft relative">
          X
          <svg
            className="absolute -top-1 -right-2 w-3 h-3 text-primary"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.64-.1 2.41-.29-.03-.05-.06-.1-.08-.15-1.12-2.38-.17-5.22 2.13-6.35 2.3-1.13 5.08-.26 6.27 1.96.03.06.05.12.08.18.12-.6.19-1.22.19-1.85 0-5.52-4.48-10-10-10zm-3.92 6.77c.58-.4 1.08-.55 1.42-.64.34-.09.6-.09.6-.09s-.15.22-.33.56c-.18.34-.39.83-.39 1.4 0 1.1.9 2 2 2s2-.9 2-2c0-.57-.21-1.06-.39-1.4-.18-.34-.33-.56-.33-.56s.26 0 .6.09c.34.09.84.24 1.42.64.58.4 1.18 1.04 1.58 2.04.14.36.25.76.32 1.19H5c.07-.43.18-.83.32-1.19.4-1 1-1.64 1.58-2.04z" />
          </svg>
        </span>
      </div>
      {showTagline && (
        <p className="text-muted-foreground text-sm font-light tracking-wide">
          Grow. Share. Sell Plants.
        </p>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {LogoContent}
      </motion.div>
    );
  }

  return LogoContent;
};

export default PlantXLogo;
