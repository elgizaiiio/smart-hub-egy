import { useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { ALL_MODEL_DETAILS, type ModelDetail } from "@/lib/modelDetails";
import type { ModelOption } from "./ModelSelector";

const MODEL_BADGES: Record<string, string[]> = {
  "nano-banana-2": ["Multi-Image Input", "4K"],
  "nano-banana-pro": ["Multi-Image Input", "4K"],
  "seedream-4": ["Multi-Image Input", "3K"],
  "seedream-5-lite": ["Multi-Image Input", "4K"],
  "gpt-image": ["Multi-Image Input", "4K"],
  "gpt-image-1": ["Multi-Image Input", "1K"],
  "ideogram-3": ["1K", "Styles"],
  "flux-kontext": ["Image Input", "2K"],
  "flux-2-pro": ["Image Input", "2K"],
  "grok-imagine": ["Image Input", "1K"],
  "recraft-v4": ["2K"],
  "lucid-origin": ["Style Ref", "Content Ref"],
  "imagineart-1.5": ["Multi-Image Input", "4K"],
  "fal-hidream-i1": ["Multi-Image Input", "2K"],
  "fal-aura-v2": ["1K"],
  "fal-flux-realism": ["2K"],
  "megsy-v1-img": ["Image Ref"],
};

// Real provider logos (from public/model-logos/)
const MODEL_LOGOS: Record<string, string> = {
  "megsy-v1-img": "/model-logos/megsy.png",
  "gpt-image": "/model-logos/openai.svg",
  "gpt-image-1": "/model-logos/openai.svg",
  "nano-banana-2": "/model-logos/google.ico",
  "nano-banana-pro": "/model-logos/google.ico",
  "flux-kontext": "/model-logos/bfl.png",
  "flux-2-pro": "/model-logos/bfl.png",
  "fal-flux-realism": "/model-logos/bfl.png",
  "ideogram-3": "/model-logos/ideogram.png",
  "seedream-4": "/model-logos/bytedance.ico",
  "seedream-5-lite": "/model-logos/bytedance.ico",
  "recraft-v4": "/model-logos/recraft.png",
  "grok-imagine": "/model-logos/xai.ico",
  "imagineart-1.5": "/model-logos/fal.ico",
  "fal-hidream-i1": "/model-logos/fal.ico",
  "fal-aura-v2": "/model-logos/fal.ico",
};

const NEW_MODELS = ["nano-banana-2", "seedream-5-lite", "ideogram-3"];

interface InlineModelPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (model: ModelOption) => void;
  selectedModelId: string;
}

const InlineModelPicker = ({ open, onClose, onSelect, selectedModelId }: InlineModelPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const imageModels = useMemo(() => {
    return ALL_MODEL_DETAILS.filter(m => m.type === "image").slice(0, 12);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const handleSelect = (model: ModelDetail) => {
    onSelect({
      id: model.id,
      name: model.name,
      credits: model.credits.toString(),
      requiresImage: model.requiresImage,
      category: "model",
    });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-full left-0 right-0 mb-2 z-40"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-popover/80 backdrop-blur-3xl border border-border rounded-2xl shadow-lg overflow-hidden max-h-[70vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
                <h2 className="text-sm font-semibold text-foreground">Models</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Model Grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-2 gap-2">
                  {imageModels.map((model) => {
                    const isSelected = selectedModelId === model.id;
                    const isNew = NEW_MODELS.includes(model.id);
                    const isFree = model.credits === 0;
                    const badges = MODEL_BADGES[model.id] || [];
                    const logo = MODEL_LOGOS[model.id];

                    return (
                      <motion.button
                        key={model.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(model)}
                        className={`relative flex flex-col p-3.5 rounded-xl text-left transition-all duration-300 backdrop-blur-xl ${
                          isSelected
                            ? "bg-accent/80 border border-primary/30 shadow-sm"
                            : "bg-muted/40 border border-border/50 hover:bg-accent/60 hover:border-border"
                        }`}
                      >
                        {/* Selected check */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                        )}

                        {/* Top row */}
                        <div className="flex items-center gap-2.5 mb-2">
                          {logo && (
                            <img
                              src={logo}
                              alt=""
                              className="w-5 h-5 rounded-md object-contain pointer-events-auto"
                            />
                          )}
                          <span className="text-[13px] font-semibold text-foreground">{model.name}</span>
                          {isNew && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-warning text-black font-bold uppercase tracking-wide">
                              New
                            </span>
                          )}
                          {isFree && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                              FREE
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
                          {model.description}
                        </p>

                        {/* Badges + Credits */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 flex-wrap">
                            {badges.map((badge) => (
                              <span
                                key={badge}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                          {model.credits > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">{model.credits} MC</span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InlineModelPicker;
