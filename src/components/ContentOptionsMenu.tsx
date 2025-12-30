import { MoreVertical, Pencil, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContentOptionsMenuProps {
  onEdit: () => void;
  onShareToStory: () => void;
}

const ContentOptionsMenu = ({ onEdit, onShareToStory }: ContentOptionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <MoreVertical className="w-4 h-4 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit} className="gap-2">
          <Pencil className="w-4 h-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShareToStory} className="gap-2">
          <Share2 className="w-4 h-4" />
          Share to Story
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContentOptionsMenu;
