import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Clock, Ratio, Sparkles, FileType } from "lucide-react";
import type { ShowcaseItem } from "./ShowcaseGrid";

interface ShowcaseDetailModalProps {
  item: ShowcaseItem | null;
  onClose: () => void;
  onRecreate?: (item: ShowcaseItem) => void;
}

const ShowcaseDetailModal = ({ item, onClose, onRecreate }: ShowcaseDetailModalProps) => {
  if (!item) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = item.media_url;
    a.download = `${item.prompt.slice(0, 30).replace(/\s+/g, "_")}.${item.media_type === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const specs = [
    { label: "Model", value: item.model_name, icon: Sparkles },
    { label: "Aspect ratio", value: item.aspect_ratio, icon: Ratio },
    { label: "Quality", value: item.quality, icon: FileType },
    ...(item.duration ? [{ label: "Duration", value: item.duration, icon: Clock }] : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
        >
          {/* Media */}
          <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
            {item.media_type === "video" ? (
              <video
                src={item.media_url}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh] pointer-events-auto"
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.prompt}
                className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh] pointer-events-auto"
              />
            )}
          </div>

          {/* Details */}
          <div className="w-full md:w-[320px] shrink-0 flex flex-col p-5 border-t md:border-t-0 md:border-l border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Details</h3>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Prompt</p>
              <p className="text-sm text-foreground leading-relaxed">{item.prompt}</p>
            </div>

            {/* Specs */}
            <div className="space-y-3 mb-5">
              {specs.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              {onRecreate && (
                <button
                  onClick={() => onRecreate(item)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Recreate
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShowcaseDetailModal;
