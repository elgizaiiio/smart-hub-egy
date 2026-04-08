import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
  statusHistory?: string[];
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

// Detect computer use from status events - much more reliable than keyword matching
function detectComputerUse(statusHistory: string[]): boolean {
  const browserKeywords = [
    "browser", "browsing", "smart browser", "opening smart browser",
    "navigat", "clicking", "scrolling", "extracting",
    "canva", "opened", "browse", "executing task",
    "browser opened", "opening canva", "go to",
    "فتح المتصفح", "تصفح", "المتصفح",
    // Status events from the backend
    "opening smart browser", "browser opened", "browsing completed",
    "canva opened", "failed to open"
  ];
  return statusHistory.some(s => {
    const lower = s.toLowerCase();
    return browserKeywords.some(k => lower.includes(k));
  });
}

const ThinkingLoader = ({ searchQuery, searchStatus, statusHistory = [] }: ThinkingLoaderProps) => {
  const [showLive, setShowLive] = useState(false);
  const hasRealSteps = statusHistory.length > 0;
  const actualComputerUse = detectComputerUse(statusHistory);

  const latestStatus = hasRealSteps ? statusHistory[statusHistory.length - 1] : null;
  const displayText = searchStatus || latestStatus || "Thinking";
  const starColor = getStarColor(displayText, actualComputerUse);

  return (
    <div className="py-2">
      {/* Computer Use header — only when actually triggered */}
      {actualComputerUse && (
        <div className="flex items-center gap-2.5 mb-1.5">
          <svg
            width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
            className="shrink-0" style={{ color: "#a78bfa" }}
          >
            <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
          </svg>
          <span className="text-xs font-semibold text-violet-400">Megsy Computer</span>
          <button
            onClick={() => setShowLive(true)}
            className="ml-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors"
          >
            View Live
          </button>
        </div>
      )}

      {/* Main status line */}
      <div className="flex items-center gap-2.5">
        <motion.svg
          width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
          className="shrink-0" style={{ color: starColor }}
          animate={{ y: [0, -4, 0], rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
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
      </div>

      {/* Steps log — always visible, no toggle */}
      {hasRealSteps && statusHistory.length > 1 && (
        <div className="ml-8 mt-1.5 space-y-1 text-[11px] text-muted-foreground max-h-48 overflow-y-auto">
          {statusHistory.slice(0, -1).map((step, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 bg-muted-foreground/40" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* View Live Dialog */}
      <Dialog open={showLive} onOpenChange={setShowLive}>
        <DialogContent className="max-w-md max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ color: "#a78bfa" }}>
                <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
              </svg>
              Megsy Computer — Live
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {statusHistory.length === 0 && (
              <p className="text-sm text-muted-foreground">No steps recorded yet...</p>
            )}
            {statusHistory.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === statusHistory.length - 1 ? "bg-violet-400 animate-pulse" : "bg-muted-foreground/40"}`} />
                <span className={i === statusHistory.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ThinkingLoader);
