import { motion } from "framer-motion";

interface PlantCardProps {
  name: string;
  image: string;
  height: string;
  size: string;
  price?: number;
  nurseryName: string;
  onClick?: () => void;
}

const PlantCard = ({ name, image, height, size, price, nurseryName, onClick }: PlantCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="bg-card rounded-xl plantx-shadow overflow-hidden text-left w-full"
      whileTap={{ scale: 0.98 }}
    >
      <div className="aspect-square bg-secondary relative">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        {price && (
          <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-full">
            <span className="text-xs font-semibold text-primary-foreground">₹{price}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground truncate">{name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{height}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
        <p className="text-xs text-primary font-medium mt-1.5 truncate">{nurseryName}</p>
      </div>
    </motion.button>
  );
};

export default PlantCard;
