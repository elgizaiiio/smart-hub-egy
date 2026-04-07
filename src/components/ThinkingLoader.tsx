import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Monitor } from "lucide-react";

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
  statusHistory?: string[];
  isComputerUse?: boolean;
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

const ThinkingLoader = ({ searchQuery, searchStatus, statusHistory = [], isComputerUse }: ThinkingLoaderProps) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(true);

  const isSearching = !!searchQuery || !!searchStatus;
  const hasRealSteps = statusHistory.length > 0;

  useEffect(() => {
    if (!isSearching && !isComputerUse) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_CYCLE.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isSearching, isComputerUse]);

  const currentStatus = isSearching || isComputerUse ? STATUS_CYCLE[statusIndex] : STATUS_CYCLE[0];
  const displayText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : currentStatus.text);
  const starColor = isComputerUse ? "#a78bfa" : (STAR_COLORS[currentStatus.text] || "hsl(var(--primary))");

  return (
    <div className="py-2">
      {/* Computer Use Header */}
      {isComputerUse && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Monitor className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400">Megsy Computer</span>
          </div>
        </div>
      )}

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
            className={`text-xs ${isComputerUse ? "text-violet-400" : currentStatus.color}`}
          >
            {displayText}
          </motion.span>
        </AnimatePresence>

        {(hasRealSteps || isSearching || isComputerUse) && (
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stepsOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {stepsOpen && (hasRealSteps || isSearching || isComputerUse) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-8 mt-1.5"
          >
            <div className="space-y-1 text-[11px] text-muted-foreground max-h-48 overflow-y-auto">
              {hasRealSteps ? (
                statusHistory.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-start gap-1.5"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                      i === statusHistory.length - 1 ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                    }`} />
                    <span className={i === statusHistory.length - 1 ? "text-foreground/80" : ""}>
                      {step}
                    </span>
                  </motion.div>
                ))
              ) : (
                <>
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
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingLoader;
