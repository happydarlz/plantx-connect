import { motion } from "framer-motion";

interface StoryCircleProps {
  name: string;
  image: string;
  hasStory?: boolean;
  isOwn?: boolean;
  onClick?: () => void;
}

const StoryCircle = ({ name, image, hasStory = true, isOwn = false, onClick }: StoryCircleProps) => {
  return (
    <motion.button
      className="flex flex-col items-center gap-1.5 min-w-[72px]"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`relative ${hasStory ? "story-ring" : "p-0.5 bg-border"} rounded-full`}>
        <div className="w-16 h-16 rounded-full bg-background p-0.5">
          <img
            src={image}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
            <span className="text-primary-foreground text-xs font-bold">+</span>
          </div>
        )}
      </div>
      <span className="text-[11px] font-medium text-foreground truncate max-w-[68px]">
        {isOwn ? "Your Story" : name}
      </span>
    </motion.button>
  );
};

export default StoryCircle;
