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

const InfoCards = ({ items, onAction }: InfoCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-xl border border-border/60 bg-secondary/20 p-3.5"
        >
          <p className="text-sm font-medium text-foreground mb-1">{item.title}</p>
          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
          {item.action && onAction && (
            <button
              onClick={() => onAction(item.action!, item.title)}
              className="text-xs text-primary hover:underline transition-colors"
            >
              {item.action}
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default InfoCards;
