import { motion } from "framer-motion";

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
}

const SparkleIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
      fill="currentColor"
    />
  </svg>
);

const ThinkingLoader = ({ searchQuery, searchStatus }: ThinkingLoaderProps) => {
  const statusText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : "Thinking");

  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3, scale: 0.5 }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
            className="text-primary"
          >
            <SparkleIcon size={i === 1 ? 18 : 13} />
          </motion.div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground animate-pulse">{statusText}</span>
    </div>
  );
};

/** Static sparkle badge shown below completed AI messages */
export const SparklesBadge = () => (
  <div className="flex items-center gap-1 mt-1.5 opacity-50">
    {[10, 14, 10].map((size, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
        className="text-primary"
      >
        <SparkleIcon size={size} />
      </motion.div>
    ))}
  </div>
);

export default ThinkingLoader;
