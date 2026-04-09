import { useMemo, useState, memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BrowserLiveState {
  currentUrl?: string;
  liveUrl?: string;
  screenshotUrl?: string;
  currentStep?: string;
}

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
  statusHistory?: string[];
  browserLiveState?: BrowserLiveState | null;
}

function obfuscateStatus(step: string): string {
  // Remove any URLs from status text
  let cleaned = step.replace(/https?:\/\/[^\s]+/g, "").replace(/—/g, "").trim();
  if (!cleaned) return "Searching the web...";

  const lower = cleaned.toLowerCase();
  if (/opening smart browser|browser opened|starting megsy/i.test(lower)) return "Starting Megsy Computer...";
  if (/navigat|go to|entered|visit/i.test(lower)) return "Visiting a website...";
  if (/scroll/i.test(lower)) return "Scrolling through page...";
  if (/extract|collect|gather/i.test(lower)) return "Collecting data...";
  if (/compare/i.test(lower)) return "Comparing results...";
  if (/completed|done|finished|data collection/i.test(lower)) return "Task completed";
  if (/timed out/i.test(lower)) return "Taking longer than expected...";
  if (/failed|error/i.test(lower)) return "Something went wrong";
  if (/search/i.test(lower)) return "Searching the web...";
  if (/analyz/i.test(lower)) return "Analyzing results...";
  if (/writ/i.test(lower)) return "Writing response...";
  if (/click/i.test(lower)) return "Interacting with page...";
  if (/megsy computer is working|browsing the web/i.test(lower)) return "Megsy Computer is working...";
  if (/reviewing/i.test(lower)) return "Reviewing the sources...";
  if (/product|store|price/i.test(lower)) return "Searching stores...";
  if (cleaned.length > 60) return cleaned.slice(0, 57) + "...";
  return cleaned || "Working on your request...";
}

function detectComputerUse(statusHistory: string[], browserLiveState?: BrowserLiveState | null): boolean {
  if (browserLiveState?.liveUrl || browserLiveState?.screenshotUrl) return true;
  const browserKeywords = [
    "browser", "browsing", "smart browser", "opening smart browser",
    "megsy computer", "starting megsy", "navigat", "clicking", "scrolling", "extracting",
    "opened", "browse", "executing task", "go to",
  ];
  return statusHistory.some((s) => {
    const lower = s.toLowerCase();
    return browserKeywords.some((k) => lower.includes(k));
  });
}

const ThinkingLoader = ({ searchStatus, statusHistory = [], browserLiveState }: ThinkingLoaderProps) => {
  const [showLive, setShowLive] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const combinedStatuses = [searchStatus || "", ...statusHistory].filter(Boolean);
  const actualComputerUse = detectComputerUse(combinedStatuses, browserLiveState);
  const latestStatus = searchStatus || statusHistory[statusHistory.length - 1] || "Thinking";
  const displayText = obfuscateStatus(latestStatus);

  const friendlyHistory = useMemo(() => {
    return statusHistory
      .map(obfuscateStatus)
      .filter((step, index, arr) => step && arr.indexOf(step) === index);
  }, [statusHistory]);

  // Auto-scroll the live log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [friendlyHistory]);

  // Refresh screenshot periodically
  const [screenshotKey, setScreenshotKey] = useState(0);
  useEffect(() => {
    if (!showLive || !browserLiveState?.screenshotUrl) return;
    const interval = setInterval(() => setScreenshotKey(k => k + 1), 3000);
    return () => clearInterval(interval);
  }, [showLive, browserLiveState?.screenshotUrl]);

  return (
    <div className="py-2 space-y-1.5">
      {/* Line 1: Star + Megsy Computer label + View button */}
      {actualComputerUse ? (
        <div className="flex items-center gap-2">
          <motion.svg
            width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 text-primary"
            animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
          </motion.svg>
          <span className="text-xs font-semibold text-foreground">Megsy Computer</span>
          <button
            onClick={() => setShowLive(true)}
            className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
        </div>
      ) : null}

      {/* Line 2: Star + dynamic status text */}
      <div className="flex items-center gap-2">
        <motion.svg
          width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 text-muted-foreground"
          animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
        </motion.svg>
        <span className="text-xs text-muted-foreground">{displayText}</span>
      </div>

      {/* View Live Dialog */}
      <Dialog open={showLive} onOpenChange={setShowLive}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm">
              <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
              </svg>
              Megsy Computer — Live Activity
              <span className="flex items-center gap-1 ml-auto text-[10px] text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto pr-1 max-h-[60vh]">
            {/* Live screenshot */}
            {browserLiveState?.screenshotUrl ? (
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <img
                  key={screenshotKey}
                  src={`${browserLiveState.screenshotUrl}${browserLiveState.screenshotUrl.includes('?') ? '&' : '?'}t=${screenshotKey}`}
                  alt="Live preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/40 bg-background/50 text-xs text-muted-foreground">
                Waiting for live preview...
              </div>
            )}

            {/* Current status */}
            <div className="rounded-xl border border-border/40 bg-secondary/20 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Current Status</p>
              <p className="text-sm text-foreground mt-0.5">{displayText}</p>
            </div>

            {/* Activity log */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground font-medium">Activity Log</p>
              {friendlyHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">Starting...</p>
              ) : (
                friendlyHistory.map((step, i) => (
                  <div
                    key={`${step}-${i}`}
                    className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <span
                      className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                        i === friendlyHistory.length - 1
                          ? "bg-primary animate-pulse"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    <span
                      className={
                        i === friendlyHistory.length - 1
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {step}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ThinkingLoader);
