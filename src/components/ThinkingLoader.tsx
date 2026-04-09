import { memo } from "react";
import { motion } from "framer-motion";

interface ThinkingLoaderProps {
  searchStatus?: string;
}

const ThinkingLoader = ({ searchStatus }: ThinkingLoaderProps) => {
  const displayText = searchStatus || "Thinking...";

  return (
    <div className="py-2">
      <div className="flex items-center gap-2">
        <motion.svg
          width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 text-primary"
          animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
        </motion.svg>
        <span className="text-xs text-muted-foreground">{displayText}</span>
      </div>
    </div>
  );
};

export default memo(ThinkingLoader);
