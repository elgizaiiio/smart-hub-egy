import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Monitor } from "lucide-react";

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
  statusHistory?: string[];
  isComputerUse?: boolean;
}

function getStarColor(text: string, isComputerUse?: boolean): string {
  if (isComputerUse) return "#a78bfa";
  const lower = text.toLowerCase();
  if (lower.includes("search") || lower.includes("بحث")) return "#60a5fa";
  if (lower.includes("writ") || lower.includes("كتاب") || lower.includes("generat")) return "#34d399";
  if (lower.includes("read") || lower.includes("قراء") || lower.includes("extract")) return "#fbbf24";
  if (lower.includes("brows") || lower.includes("open") || lower.includes("scroll") || lower.includes("navigat")) return "#a78bfa";
  return "hsl(var(--primary))";
}

const ThinkingLoader = ({ searchQuery, searchStatus, statusHistory = [], isComputerUse }: ThinkingLoaderProps) => {
  const [stepsOpen, setStepsOpen] = useState(true);
  const hasRealSteps = statusHistory.length > 0;

  // Determine display text from real events only
  const latestStatus = hasRealSteps ? statusHistory[statusHistory.length - 1] : null;
  const displayText = searchStatus || latestStatus || (searchQuery ? `Searching for "${searchQuery}"` : "Thinking");
  const starColor = getStarColor(displayText, isComputerUse);

  return (
    <div className="py-2">
      {/* Computer Use fixed header */}
      {isComputerUse && (
        <div className="flex items-center gap-2.5 mb-1.5">
          <motion.svg
            width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
            className="shrink-0" style={{ color: "#a78bfa" }}
            animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
          </motion.svg>
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400">Megsy Computer</span>
          </div>
        </div>
      )}

      {/* Main status line */}
      <div className="flex items-center gap-2.5">
        <motion.svg
          width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
          className="shrink-0" style={{ color: starColor }}
          animate={{ y: [0, -6, 0], rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
        </motion.svg>

        <AnimatePresence mode="wait">
          <motion.span
            key={displayText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-muted-foreground"
          >
            {displayText}
          </motion.span>
        </AnimatePresence>

        {hasRealSteps && (
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stepsOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Real steps log - only from statusHistory */}
      <AnimatePresence>
        {stepsOpen && hasRealSteps && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-8 mt-1.5"
          >
            <div className="space-y-1 text-[11px] text-muted-foreground max-h-48 overflow-y-auto">
              {statusHistory.map((step, i) => (
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
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingLoader;
