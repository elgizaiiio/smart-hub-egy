import { motion } from "framer-motion";

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
}

const ThinkingLoader = ({ searchQuery, searchStatus }: ThinkingLoaderProps) => {
  const statusText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : "Thinking");

  return (
    <div className="flex items-center gap-2.5 py-2">
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0"
        animate={{
          y: [0, -6, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z"
          fill="currentColor"
        />
      </motion.svg>
      <span className="text-xs text-muted-foreground animate-pulse">{statusText}</span>
    </div>
  );
};

export default ThinkingLoader;
