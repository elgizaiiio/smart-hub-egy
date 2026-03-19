import { motion } from "framer-motion";

interface FlowStep {
  title: string;
  description: string;
  actions?: string[];
}

interface FlowCardProps {
  steps: FlowStep[];
  onAction: (action: string, stepTitle: string) => void;
}

const FlowCard = ({ steps, onAction }: FlowCardProps) => {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          {/* Connector line + dot */}
          <div className="flex flex-col items-center shrink-0 w-6">
            <div className={`w-3 h-3 rounded-full border-2 border-primary bg-background shrink-0 mt-4`} />
            {i < steps.length - 1 && (
              <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
            )}
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex-1 rounded-xl border border-border/60 bg-secondary/20 p-3.5 mb-2"
          >
            <p className="text-sm font-medium text-foreground mb-1">{step.title}</p>
            <p className="text-xs text-muted-foreground mb-2.5">{step.description}</p>
            {step.actions && step.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.actions.map((action, j) => (
                  <button
                    key={j}
                    onClick={() => onAction(action, step.title)}
                    className="px-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs text-foreground hover:bg-accent/50 hover:border-primary/30 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      ))}
    </div>
  );
};

export default FlowCard;
