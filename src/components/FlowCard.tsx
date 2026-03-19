import { motion } from "framer-motion";

interface FlowStep {
  title: string;
  description: string;
  actions?: string[];
}

interface FlowCardProps {
  steps: FlowStep[];
  onAction?: (action: string, stepTitle: string) => void;
}

const STEP_COLORS = [
  "from-[hsl(262,60%,55%)] to-[hsl(262,60%,45%)]",
  "from-[hsl(217,70%,50%)] to-[hsl(217,70%,40%)]",
  "from-[hsl(142,50%,45%)] to-[hsl(142,50%,35%)]",
  "from-[hsl(38,92%,50%)] to-[hsl(38,92%,40%)]",
  "from-[hsl(0,62%,50%)] to-[hsl(0,62%,40%)]",
  "from-[hsl(180,60%,45%)] to-[hsl(180,60%,35%)]",
];

const FlowCard = ({ steps, onAction }: FlowCardProps) => {
  return (
    <div className="relative flex flex-col items-center gap-0 py-2">
      {steps.map((step, i) => {
        const colorClass = STEP_COLORS[i % STEP_COLORS.length];
        return (
          <div key={i} className="flex flex-col items-center w-full">
            {/* Connector line */}
            {i > 0 && (
              <div className="w-px h-8 bg-border" />
            )}
            {/* Step number */}
            <div className="flex items-center gap-3 w-full max-w-xs mb-1">
              <span className="text-[10px] text-muted-foreground font-medium shrink-0 w-6 text-right">{i + 1}</span>
              <div className="flex-1" />
            </div>
            {/* Card with fancy-btn animation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="fancy-btn relative w-full max-w-xs cursor-default"
              style={{ height: 'auto', padding: 0 }}
            >
              <span className="fold" />
              <div className="points_wrapper">
                {Array.from({ length: 8 }).map((_, pi) => (
                  <span key={pi} className="point" />
                ))}
              </div>
              <div className={`inner !flex-col !items-start !gap-1 w-full bg-gradient-to-br ${colorClass} rounded-xl px-4 py-3`}>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-white/70">{step.description}</p>
                {step.actions && step.actions.length > 0 && onAction && (
                  <div className="flex gap-2 mt-2">
                    {step.actions.map((action, ai) => (
                      <button
                        key={ai}
                        onClick={() => onAction(action, step.title)}
                        className="px-3 py-1 rounded-lg bg-white/20 text-xs text-white font-medium hover:bg-white/30 transition-colors backdrop-blur-sm"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default FlowCard;
