import { motion } from "framer-motion";

type Mode = "chat" | "code" | "files" | "images" | "videos";

interface ModeSelectorProps {
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modes: { id: Mode; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "files", label: "Files" },
  { id: "code", label: "Code" },
];

const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {modes.map((mode) => (
        <motion.button
          key={mode.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange(mode.id)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeMode === mode.id
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {mode.label}
        </motion.button>
      ))}
    </div>
  );
};

export default ModeSelector;
