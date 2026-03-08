import { Check, Loader2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BuildStepStatus = "pending" | "active" | "done" | "error";

export interface BuildStep {
  id: string;
  label: string;
  detail?: string;
  status: BuildStepStatus;
}

interface BuildTimelineProps {
  steps: BuildStep[];
}

const StatusIcon = ({ status }: { status: BuildStepStatus }) => {
  switch (status) {
    case "done":
      return (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      );
    case "active":
      return (
        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
        </div>
      );
    case "error":
      return (
        <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0">
          <span className="text-destructive-foreground text-[10px] font-bold">!</span>
        </div>
      );
    default:
      return <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />;
  }
};

const BuildTimeline = ({ steps }: BuildTimelineProps) => {
  const [expanded, setExpanded] = useState(true);
  const activeCount = steps.filter((s) => s.status === "done").length;
  const total = steps.length;

  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Loader2
            className={`w-4 h-4 ${
              activeCount < total ? "animate-spin text-primary" : "text-primary"
            }`}
          />
          <span className="text-sm font-medium text-foreground">
            {activeCount === total
              ? "Build complete"
              : `Building... (${activeCount}/${total})`}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-0">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-3 relative">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className={`absolute left-[9px] top-6 w-0.5 h-[calc(100%-4px)] ${
                        step.status === "done"
                          ? "bg-primary/40"
                          : "bg-muted-foreground/10"
                      }`}
                    />
                  )}
                  <div className="pt-1.5">
                    <StatusIcon status={step.status} />
                  </div>
                  <div className="py-1.5 min-w-0">
                    <p
                      className={`text-sm ${
                        step.status === "done"
                          ? "text-foreground"
                          : step.status === "active"
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.detail && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuildTimeline;
