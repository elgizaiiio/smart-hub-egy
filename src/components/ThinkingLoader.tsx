import { useMemo, useState, memo } from "react";
import { motion } from "framer-motion";
import { Monitor } from "lucide-react";
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

function getStarColor(isComputerUse?: boolean): string {
  return isComputerUse ? "hsl(var(--primary))" : "hsl(var(--foreground))";
}

function detectComputerUse(statusHistory: string[], browserLiveState?: BrowserLiveState | null): boolean {
  if (browserLiveState?.currentUrl || browserLiveState?.liveUrl || browserLiveState?.screenshotUrl) return true;
  const browserKeywords = [
    "browser", "browsing", "smart browser", "opening smart browser",
    "navigat", "clicking", "scrolling", "extracting",
    "opened", "browse", "executing task", "go to",
  ];
  return statusHistory.some((s) => {
    const lower = s.toLowerCase();
    return browserKeywords.some((k) => lower.includes(k));
  });
}

function toFriendlyStep(step: string): string {
  const lower = step.toLowerCase();
  if (/opening smart browser|browser opened/.test(lower)) return "Starting Megsy Computer...";
  if (/navigating|go to|entered|visit/.test(lower)) return "Visiting website...";
  if (/scroll/.test(lower)) return "Scrolling through page...";
  if (/extract|collect|gather/.test(lower)) return "Collecting data...";
  if (/compare/.test(lower)) return "Comparing results...";
  if (/completed|done|finished/.test(lower)) return "Task completed";
  if (/timed out/.test(lower)) return "Taking longer than expected...";
  if (/failed|error/.test(lower)) return "Something went wrong";
  if (/search/i.test(lower)) return "Searching the web...";
  if (/analyz/i.test(lower)) return "Analyzing results...";
  if (/writ/i.test(lower)) return "Writing response...";
  return "Working on your request...";
}

const ThinkingLoader = ({ searchStatus, statusHistory = [], browserLiveState }: ThinkingLoaderProps) => {
  const [showLive, setShowLive] = useState(false);
  const combinedStatuses = [searchStatus || "", ...statusHistory].filter(Boolean);
  const actualComputerUse = detectComputerUse(combinedStatuses, browserLiveState);
  const latestStatus = searchStatus || statusHistory[statusHistory.length - 1] || "Thinking";
  const displayText = actualComputerUse ? toFriendlyStep(latestStatus) : toFriendlyStep(latestStatus);
  const starColor = getStarColor(actualComputerUse);

  const friendlyHistory = useMemo(() => {
    return statusHistory.map(toFriendlyStep).filter((step, index, arr) => step && arr.indexOf(step) === index);
  }, [statusHistory]);

  return (
    <div className="py-2 space-y-2">
      <div className="flex items-center gap-2.5">
        <motion.svg
          width="18"
          height="18"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          style={{ color: starColor }}
          animate={{ y: [0, -4, 0], rotate: [0, 180, 360], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
        </motion.svg>

        {actualComputerUse ? (
          <>
            <span className="text-xs font-semibold text-foreground">Megsy Computer</span>
            <button
              onClick={() => setShowLive(true)}
              className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-secondary/40 px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Monitor className="w-3 h-3" />
              <span>View Live</span>
            </button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{displayText}</span>
        )}
      </div>

      {actualComputerUse && (
        <button
          type="button"
          onClick={() => setShowLive(true)}
          className="w-full rounded-2xl border border-border/40 bg-secondary/25 p-3 text-left transition-colors hover:bg-secondary/40"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-foreground">{displayText}</p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate max-w-[260px]">
                Searching the web
              </p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live
            </span>
          </div>

          {browserLiveState?.screenshotUrl ? (
            <img
              src={browserLiveState.screenshotUrl}
              alt="Megsy Computer live preview"
              className="mt-3 h-40 w-full rounded-xl border border-border/30 object-cover"
            />
          ) : (
            <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-border/40 bg-background/50 px-4 text-center text-xs text-muted-foreground">
              Megsy Computer is working — tap View Live to see the activity log.
            </div>
          )}
        </button>
      )}

      <Dialog open={showLive} onOpenChange={setShowLive}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ color: "hsl(var(--primary))" }}>
                <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
              </svg>
              Megsy Computer — Activity Log
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="rounded-2xl border border-border/40 bg-secondary/20 p-3">
              <p className="text-[11px] text-muted-foreground">Status</p>
              <p className="mt-1 text-sm text-foreground">Searching the web</p>
            </div>

            <div className="space-y-2">
              {friendlyHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity logged yet.</p>
              ) : (
                friendlyHistory.map((step, i) => (
                  <div key={`${step}-${i}`} className="flex items-start gap-2 rounded-xl border border-border/30 bg-background/40 px-3 py-2.5 text-sm">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i === friendlyHistory.length - 1 ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
                    <span className={i === friendlyHistory.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}>{step}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ThinkingLoader);
