import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
}

const STATUS_CYCLE = [
  { text: "Thinking", color: "text-primary" },
  { text: "Searching", color: "text-blue-400" },
  { text: "Reading", color: "text-amber-400" },
  { text: "Writing", color: "text-emerald-400" },
];

const STAR_COLORS: Record<string, string> = {
  Thinking: "hsl(var(--primary))",
  Searching: "#60a5fa",
  Reading: "#fbbf24",
  Writing: "#34d399",
};

const ThinkingLoader = ({ searchQuery, searchStatus }: ThinkingLoaderProps) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);

  const isSearching = !!searchQuery || !!searchStatus;

  useEffect(() => {
    if (!isSearching) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_CYCLE.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isSearching]);

  const currentStatus = isSearching ? STATUS_CYCLE[statusIndex] : STATUS_CYCLE[0];
  const displayText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : currentStatus.text);
  const starColor = STAR_COLORS[currentStatus.text] || "hsl(var(--primary))";

  return (
    <div className="py-2">
      <div className="flex items-center gap-2.5">
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          style={{ color: starColor }}
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

        <AnimatePresence mode="wait">
          <motion.span
            key={displayText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`text-xs ${currentStatus.color}`}
          >
            {displayText}
          </motion.span>
        </AnimatePresence>

        {isSearching && (
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stepsOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {stepsOpen && isSearching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-8 mt-1.5"
          >
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                Understanding the request
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                {searchQuery ? `Searching: "${searchQuery}"` : "Processing"}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                Generating response
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingLoader;
