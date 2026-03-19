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

// Animated star that changes color based on state
const AnimatedStar = ({ status }: { status?: string }) => {
  // Determine color based on status
  let colorClass = "text-primary"; // default thinking
  if (status?.toLowerCase().includes("search") || status?.toLowerCase().includes("بحث")) {
    colorClass = "text-blue-500";
  } else if (status?.toLowerCase().includes("writ") || status?.toLowerCase().includes("كتب") || status?.toLowerCase().includes("يكتب")) {
    colorClass = "text-green-500";
  } else if (status?.toLowerCase().includes("read") || status?.toLowerCase().includes("يقرأ")) {
    colorClass = "text-amber-500";
  }

  return (
    <motion.div
      className="relative"
      animate={{
        rotate: [0, 180, 360],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={`${colorClass} transition-colors duration-500`}>
        <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
      </svg>
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={`${colorClass} blur-sm`}>
          <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

const ThinkingLoader = ({ searchQuery, searchStatus, steps }: ThinkingLoaderProps) => {
  const [expanded, setExpanded] = useState(false);

  const displaySteps: ThinkingStep[] = steps || [];
  if (displaySteps.length === 0 && searchQuery) {
    displaySteps.push({ label: `Searching for "${searchQuery}"`, icon: "search" });
  }

  const statusText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : "Still working on it");

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

        <div className="flex items-center gap-2.5 py-2">
          <AnimatedStar status={searchStatus} />
          <span className="text-sm text-muted-foreground italic">{statusText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 py-2">
      <AnimatedStar />
      <span className="text-sm text-muted-foreground italic">Still working on it</span>
    </div>
  );
};

export default ThinkingLoader;
