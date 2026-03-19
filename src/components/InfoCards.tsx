import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface InfoItem {
  title: string;
  description: string;
  action?: string;
}

interface InfoCardsProps {
  items: InfoItem[];
  onAction?: (action: string, title: string) => void;
}

const CARD_GRADIENTS = [
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
      }, 18);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  
  return <>{displayed}</>;
};

const InfoCards = ({ items, onAction }: InfoCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="fancy-btn relative cursor-default"
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
            style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
          >
            <p className="text-sm font-semibold text-white truncate w-full">
              <TypewriterText text={item.title} delay={i * 200} />
            </p>
            <p className="text-xs text-white/70 line-clamp-3">
              <TypewriterText text={item.description} delay={i * 200 + 150} />
            </p>
            {item.action && onAction && (
              <button
                onClick={() => onAction(item.action!, item.title)}
                className="mt-1 px-3 py-1 rounded-lg bg-white/20 text-[11px] text-white font-medium hover:bg-white/30 transition-colors"
              >
                {item.action}
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InfoCards;
