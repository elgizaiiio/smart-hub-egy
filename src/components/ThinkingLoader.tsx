import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Globe, FileText } from "lucide-react";

interface ThinkingStep {
  label: string;
  icon: "search" | "read" | "think";
}

interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
  steps?: ThinkingStep[];
}

const StepIcon = ({ type }: { type: string }) => {
  if (type === "search") return <Globe className="w-3.5 h-3.5 text-muted-foreground" />;
  if (type === "read") return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  return null;
};

const ThinkingLoader = ({ searchQuery, searchStatus, steps }: ThinkingLoaderProps) => {
  const [expanded, setExpanded] = useState(false);

  // Build display steps from props
  const displaySteps: ThinkingStep[] = steps || [];
  if (displaySteps.length === 0 && searchQuery) {
    displaySteps.push({ label: `Searching for "${searchQuery}"`, icon: "search" });
  }

  const statusText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : "Still working on it");

  // Collapsible style like Claude
  if (displaySteps.length > 0 || searchQuery) {
    return (
      <div className="space-y-1">
        {displaySteps.map((step, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ChevronLeft className={`w-3 h-3 transition-transform ${expanded ? "-rotate-90" : ""}`} />
            <span>{step.label}</span>
            <StepIcon type={step.icon} />
          </motion.button>
        ))}

        {/* Active status */}
        <div className="flex items-center gap-2.5 py-2">
          <span className="text-sm text-muted-foreground italic">{statusText}</span>
          <motion.div
            className="w-5 h-5 shrink-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              {[...Array(8)].map((_, i) => (
                <circle
                  key={i}
                  cx={12 + 8 * Math.cos((i * Math.PI * 2) / 8)}
                  cy={12 + 8 * Math.sin((i * Math.PI * 2) / 8)}
                  r={1.2}
                  fill="currentColor"
                  className="text-primary"
                  opacity={0.3 + (i / 8) * 0.7}
                />
              ))}
            </svg>
          </motion.div>
        </div>
      </div>
    );
  }

  // Simple thinking state
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="text-sm text-muted-foreground italic">Still working on it</span>
      <motion.div
        className="w-5 h-5 shrink-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              cx={12 + 8 * Math.cos((i * Math.PI * 2) / 8)}
              cy={12 + 8 * Math.sin((i * Math.PI * 2) / 8)}
              r={1.2}
              fill="currentColor"
              className="text-primary"
              opacity={0.3 + (i / 8) * 0.7}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
};

export default ThinkingLoader;
