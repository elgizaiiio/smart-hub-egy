import { motion } from "framer-motion";
import { MessageSquare, Image, Video, FileText, Code } from "lucide-react";

type Mode = "chat" | "code" | "files" | "images" | "videos";

interface ModeSelectorProps {
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modes: { id: Mode; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "images", label: "Images", icon: Image },
  { id: "videos", label: "Videos", icon: Video },
  { id: "files", label: "Files", icon: FileText },
  { id: "code", label: "Code", icon: Code },
];

const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {modes.map((mode, i) => {
        const Icon = mode.icon;
        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onModeChange(mode.id)}
            className={`flex flex-col items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 min-w-[72px] ${
              activeMode === mode.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
