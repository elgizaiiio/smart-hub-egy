import { useMemo } from "react";
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

const MODEL_ICONS: Record<string, { letter: string; gradient: string }> = {
  "nano-banana-2": { letter: "G", gradient: "from-yellow-400 to-orange-500" },
  "nano-banana-pro": { letter: "G", gradient: "from-yellow-400 to-orange-500" },
  "seedream-4": { letter: "Iu", gradient: "from-blue-400 to-purple-500" },
  "seedream-5-lite": { letter: "Iu", gradient: "from-blue-400 to-purple-500" },
  "gpt-image": { letter: "G", gradient: "from-green-400 to-emerald-500" },
  "gpt-image-1": { letter: "G", gradient: "from-green-400 to-emerald-500" },
  "ideogram-3": { letter: "△", gradient: "from-pink-400 to-rose-500" },
  "flux-kontext": { letter: "△", gradient: "from-cyan-400 to-blue-500" },
  "flux-2-pro": { letter: "△", gradient: "from-cyan-400 to-blue-500" },
  "grok-imagine": { letter: "◇", gradient: "from-purple-400 to-violet-500" },
  "recraft-v4": { letter: "R", gradient: "from-orange-400 to-red-500" },
  "lucid-origin": { letter: "L", gradient: "from-indigo-400 to-purple-500" },
  "imagineart-1.5": { letter: "I", gradient: "from-teal-400 to-cyan-500" },
  "megsy-v1-img": { letter: "M", gradient: "from-primary to-primary/70" },
  "fal-hidream-i1": { letter: "H", gradient: "from-violet-400 to-purple-500" },
  "fal-aura-v2": { letter: "A", gradient: "from-amber-400 to-orange-500" },
  "fal-flux-realism": { letter: "F", gradient: "from-sky-400 to-blue-500" },
};

const NEW_MODELS = ["nano-banana-2", "seedream-5-lite", "ideogram-3"];

interface InlineModelPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (model: ModelOption) => void;
  selectedModelId: string;
}

const InlineModelPicker = ({ open, onClose, onSelect, selectedModelId }: InlineModelPickerProps) => {
  const imageModels = useMemo(() => {
    return ALL_MODEL_DETAILS.filter(m => m.type === "image").slice(0, 12);
  }, []);

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
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-full left-0 right-0 mb-2 z-40"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] overflow-hidden max-h-[70vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
                <h2 className="text-sm font-semibold text-white/90">Models</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
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
                    const iconInfo = MODEL_ICONS[model.id] || { letter: "AI", gradient: "from-gray-400 to-gray-500" };

                    return (
                      <motion.button
                        key={model.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(model)}
                        className={`relative flex flex-col p-3.5 rounded-xl text-left transition-all duration-300 ${
                          isSelected
                            ? "bg-white/[0.1] border border-white/[0.2] shadow-[inset_0_0_20px_rgba(255,255,255,0.03)]"
                            : "bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1]"
                        }`}
                      >
                        {/* Selected check */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Top row */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${iconInfo.gradient} flex items-center justify-center shadow-sm`}>
                            <span className="text-[10px] font-bold text-black">{iconInfo.letter}</span>
                          </div>
                          <span className="text-[13px] font-semibold text-white/90">{model.name}</span>
                          {isNew && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#f5d90a]/90 text-black font-bold uppercase tracking-wide">
                              New
                            </span>
                          )}
                          {isFree && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.1] text-white/70 font-medium">
                              FREE
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-white/35 line-clamp-2 mb-2.5 leading-relaxed">
                          {model.description}
                        </p>

                        {/* Badges */}
                        {badges.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {badges.map((badge) => (
                              <span
                                key={badge}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/50 font-medium"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
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
