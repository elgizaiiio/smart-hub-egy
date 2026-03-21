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

const CARD_COLORS = [
  "flow-card-blue",
  "flow-card-purple",
  "flow-card-teal",
  "flow-card-amber",
  "flow-card-green",
];

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [started, text]);

  return <>{started ? displayed : ""}</>;
};

const InfoCards = ({ items, onAction }: InfoCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {items.map((item, i) => {
        const colorClass = CARD_COLORS[i % CARD_COLORS.length];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => item.action && onAction?.(item.action, item.title)}
            className={`rounded-xl p-3.5 relative overflow-hidden ${colorClass} ${item.action && onAction ? "cursor-pointer active:scale-[0.98]" : ""} transition-transform`}
          >
            <div className="flow-points-wrapper">
              {Array.from({ length: 8 }).map((_, j) => (
                <span key={j} className="flow-point" />
              ))}
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-white mb-1">
                <TypewriterText text={item.title} delay={i * 150} />
              </p>
              <p className="text-xs text-white/70">
                <TypewriterText text={item.description} delay={i * 150 + 100} />
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InfoCards;
