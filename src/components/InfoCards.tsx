import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface InfoItem {
  title: string;
  description: string;
  action?: string;
  image?: string;
  price?: string;
  store?: string;
  url?: string;
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
        const handleClick = () => {
          if (item.url) {
            window.open(item.url, "_blank", "noopener,noreferrer");
            return;
          }
          if (item.action) onAction?.(item.action, item.title);
        };

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={handleClick}
            className={`rounded-xl p-3.5 relative overflow-hidden ${colorClass} ${item.action && onAction ? "cursor-pointer active:scale-[0.98]" : ""} transition-transform`}
          >
            <div className="flow-points-wrapper">
              {Array.from({ length: 8 }).map((_, j) => (
                <span key={j} className="flow-point" />
              ))}
            </div>
            <div className="relative z-10">
              {item.image && (
                <div className="mb-3 overflow-hidden rounded-[1rem] border border-white/20 bg-white/10">
                  <img src={item.image} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
                </div>
              )}
              <p className="text-sm font-medium text-white mb-1">
                <TypewriterText text={item.title} delay={i * 150} />
              </p>
              <p className="text-xs text-white/70">
                <TypewriterText text={item.description} delay={i * 150 + 100} />
              </p>
              {(item.price || item.store) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/85">
                  {item.price && <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">{item.price}</span>}
                  {item.store && <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">{item.store}</span>}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InfoCards;
