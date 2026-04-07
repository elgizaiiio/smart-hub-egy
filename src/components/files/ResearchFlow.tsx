import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle2, Loader2, BookOpen } from "lucide-react";

export interface ResearchStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

interface ResearchFlowProps {
  steps: ResearchStep[];
  outline?: string[] | null;
}

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </svg>
);

const ICONS: Record<string, any> = {
  search: StarIcon,
  outline: FileText,
  review: CheckCircle2,
  generate: BookOpen,
};

const ResearchFlow = ({ steps, outline }: ResearchFlowProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-secondary/20 backdrop-blur-sm p-4 space-y-2"
    >
      {steps.map((step, i) => {
        const iconKey = step.id.includes("search") ? "search" : step.id.includes("outline") ? "outline" : step.id.includes("review") ? "review" : "generate";
        const Icon = ICONS[iconKey] || Search;
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 py-1.5"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              step.status === "done" ? "bg-emerald-500/20 text-emerald-400" :
              step.status === "active" ? "bg-primary/20 text-primary" :
              "bg-muted/30 text-muted-foreground/50"
            }`}>
              {step.status === "active" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : step.status === "done" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
            </div>
            <span className={`text-sm ${
              step.status === "done" ? "text-foreground" :
              step.status === "active" ? "text-foreground font-medium" :
              "text-muted-foreground/60"
            }`}>
              {step.label}
            </span>
          </motion.div>
        );
      })}

      {/* Content outline */}
      <AnimatePresence>
        {outline && outline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-border/30"
          >
            <p className="text-xs text-muted-foreground mb-2 font-medium">Content Structure</p>
            <div className="space-y-1">
              {outline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs text-foreground/80 pl-3 border-l-2 border-primary/30 py-0.5"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResearchFlow;
