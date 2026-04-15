import { motion } from "framer-motion";

export interface ResearchStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

interface ResearchFlowProps {
  steps: ResearchStep[];
  outline?: string[] | null;
}

const AnimatedStar = ({ size = 16, color = "hsl(var(--primary))" }: { size?: number; color?: string }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="shrink-0"
    style={{ color }}
    animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
  >
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </motion.svg>
);

const StaticStar = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 text-muted-foreground/40">
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </svg>
);

const ResearchFlow = ({ steps }: ResearchFlowProps) => {
  return (
    <div className="space-y-1 py-2">
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-2.5 py-1"
        >
          <div className="shrink-0 mt-0.5">
            {step.status === "active" ? (
              <AnimatedStar size={16} color="hsl(var(--primary))" />
            ) : (
              <StaticStar size={12} />
            )}
          </div>
          <span className={`text-sm ${
            step.status === "active" ? "text-foreground font-medium" : "text-muted-foreground/50"
          }`}>
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default ResearchFlow;
