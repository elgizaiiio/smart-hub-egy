import { useState, useEffect } from "react";
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

const STEP_GRADIENTS = [
  "linear-gradient(135deg, #ef4444, #f97316, #eab308)",
  "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #10b981, #059669, #047857)",
  "linear-gradient(135deg, #f59e0b, #d97706, #b45309)",
  "linear-gradient(135deg, #ec4899, #d946ef, #a855f7)",
  "linear-gradient(135deg, #06b6d4, #0891b2, #0e7490)",
];

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 20);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  
  return <>{displayed}</>;
};

const FlowCard = ({ steps, onAction }: FlowCardProps) => {
  return (
    <div className="relative flex flex-col items-center gap-0 py-2">
      {steps.map((step, i) => {
        const gradient = STEP_GRADIENTS[i % STEP_GRADIENTS.length];
        return (
          <div key={i} className="flex flex-col items-center w-full">
            {i > 0 && <div className="w-px h-6 bg-border" />}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="fancy-btn relative w-full max-w-sm cursor-default"
              style={{ height: 'auto', padding: 0 }}
            >
              <span className="fold" />
              <div className="points_wrapper">
                {Array.from({ length: 8 }).map((_, pi) => (
                  <span key={pi} className="point" />
                ))}
              </div>
              <div
                className="inner !flex-col !items-start !gap-1 w-full rounded-xl px-4 py-3 overflow-hidden"
                style={{ background: gradient }}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{i + 1}</span>
                  <p className="text-sm font-semibold text-white truncate">
                    <TypewriterText text={step.title} delay={i * 300} />
                  </p>
                </div>
                <p className="text-xs text-white/70 line-clamp-2 pl-7">
                  <TypewriterText text={step.description} delay={i * 300 + 200} />
                </p>
                {step.actions && step.actions.length > 0 && onAction && (
                  <div className="flex gap-2 mt-1.5 pl-7">
                    {step.actions.map((action, ai) => (
                      <button
                        key={ai}
                        onClick={() => onAction(action, step.title)}
                        className="px-3 py-1 rounded-lg bg-white/20 text-[11px] text-white font-medium hover:bg-white/30 transition-colors backdrop-blur-sm"
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
