import { useMemo, useState, memo } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
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

function getStarColor(text: string, isComputerUse?: boolean): string {
  if (isComputerUse) return "hsl(var(--primary))";
  const lower = text.toLowerCase();
  if (lower.includes("search") || lower.includes("بحث")) return "hsl(var(--primary))";
  if (lower.includes("writ") || lower.includes("كتاب") || lower.includes("generat")) return "hsl(var(--accent))";
  return "hsl(var(--foreground))";
}

function detectComputerUse(statusHistory: string[], browserLiveState?: BrowserLiveState | null): boolean {
  if (browserLiveState?.currentUrl || browserLiveState?.liveUrl || browserLiveState?.screenshotUrl) return true;
  const browserKeywords = [
    "browser", "browsing", "smart browser", "opening smart browser",
    "navigat", "clicking", "scrolling", "extracting", "canva",
    "opened", "browse", "executing task", "go to", "فتح المتصفح", "تصفح", "المتصفح"
  ];
  return statusHistory.some((s) => {
    const lower = s.toLowerCase();
    return browserKeywords.some((k) => lower.includes(k));
  });
}

function toFriendlyStep(step: string): string {
  const lower = step.toLowerCase();
  if (/opening smart browser|browser opened/.test(lower)) return "بدأت استخدام Megsy Computer";
  if (/navigating|go to|entered|visit/.test(lower)) return "دخلت إلى الموقع المطلوب";
  if (/scroll/.test(lower)) return "قمت بالتمرير داخل الصفحة";
  if (/extract|collect|gather/.test(lower)) return "أجمع البيانات المطلوبة";
  if (/compare/.test(lower)) return "أقارن النتائج المتاحة";
  if (/completed|done|finished/.test(lower)) return "انتهيت من تنفيذ المهمة";
  if (/timed out/.test(lower)) return "استغرقت المهمة وقتًا أطول من المتوقع";
  if (/failed|error/.test(lower)) return "حدثت مشكلة أثناء التنفيذ";
  return step;
}

const ThinkingLoader = ({ searchStatus, statusHistory = [], browserLiveState }: ThinkingLoaderProps) => {
  const [showLive, setShowLive] = useState(false);
  const combinedStatuses = [searchStatus || "", ...statusHistory].filter(Boolean);
  const actualComputerUse = detectComputerUse(combinedStatuses, browserLiveState);
  const latestStatus = searchStatus || statusHistory[statusHistory.length - 1] || "Thinking";
  const displayText = actualComputerUse ? toFriendlyStep(latestStatus) : latestStatus;
  const starColor = getStarColor(displayText, actualComputerUse);

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
              <ExternalLink className="w-3 h-3" />
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
                {browserLiveState?.currentUrl || "جاري تنفيذ المهمة داخل المتصفح"}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground">Live</span>
          </div>

          {browserLiveState?.screenshotUrl ? (
            <img
              src={browserLiveState.screenshotUrl}
              alt="Megsy Computer live preview"
              className="mt-3 h-40 w-full rounded-xl border border-border/30 object-cover"
            />
          ) : (
            <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-border/40 bg-background/50 px-4 text-center text-xs text-muted-foreground">
              يتم التنفيذ الآن داخل المتصفح — افتح View Live لرؤية السجل الحالي.
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
              Megsy Computer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="rounded-2xl border border-border/40 bg-secondary/20 p-3">
              <p className="text-[11px] text-muted-foreground">Current URL</p>
              <p className="mt-1 break-all text-sm text-foreground">{browserLiveState?.currentUrl || "—"}</p>
            </div>

            {browserLiveState?.liveUrl && (
              <a
                href={browserLiveState.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open live view
              </a>
            )}

            <div className="space-y-2">
              {friendlyHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد سجل ظاهر بعد.</p>
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
