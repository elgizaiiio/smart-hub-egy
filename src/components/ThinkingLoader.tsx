import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ThinkingLoaderProps {
  searchStatus?: string;
}

const satellites = [
  { x: -14, y: -10, delay: 0 },
  { x: 14, y: -8, delay: 0.12 },
  { x: -10, y: 14, delay: 0.24 },
  { x: 12, y: 12, delay: 0.36 },
];

const ThinkingLoader = ({ searchStatus }: ThinkingLoaderProps) => {
  const displayText = searchStatus || "ميغسي ترتّب الإجابة…";

  return (
    <div className="py-2">
      <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/90 px-3 py-2 shadow-[0_10px_30px_hsl(0_0%_0%_/_.06)] backdrop-blur-xl">
        <div className="relative h-8 w-8 shrink-0">
          {satellites.map((star, index) => (
            <motion.div
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{ marginLeft: star.x, marginTop: star.y }}
              animate={{ opacity: [0.25, 0.9, 0.25], scale: [0.7, 1.1, 0.7], rotate: [0, 20, -20, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </motion.div>
          ))}

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: [0, 180, 360], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
        </div>

        <span className="text-xs font-semibold text-muted-foreground">{displayText}</span>
      </div>
    </div>
  );
};

export default memo(ThinkingLoader);
