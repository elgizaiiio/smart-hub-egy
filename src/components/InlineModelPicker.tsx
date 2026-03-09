import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ALL_MODEL_DETAILS, type ModelDetail } from "@/lib/modelDetails";
import type { ModelOption } from "./ModelSelector";

// Model badges/capabilities
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

// Icons for models
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

// New models
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-full left-0 right-0 mb-2 z-40"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#1a1a1a]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <h2 className="text-base font-semibold text-white">Models</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Model Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
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
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect(model)}
                        className={`relative flex flex-col p-4 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-[#2a3a2a] border-2 border-[#4a7a4a]"
                            : "bg-[#252525] border border-white/5 hover:bg-[#2a2a2a] hover:border-white/10"
                        }`}
                      >
                        {/* Top row: Icon + Name + NEW badge + FREE badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${iconInfo.gradient} flex items-center justify-center`}>
                              <span className="text-[10px] font-bold text-black">{iconInfo.letter}</span>
                            </div>
                            <span className="text-sm font-semibold text-white">{model.name}</span>
                            {isNew && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f5d90a] text-black font-bold uppercase">
                                New
                              </span>
                            )}
                          </div>
                          {isFree && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/80 font-medium">
                              FREE
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-white/50 line-clamp-2 mb-3">
                          {model.description}
                        </p>

                        {/* Badges */}
                        {badges.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {badges.map((badge) => (
                              <span
                                key={badge}
                                className="text-[10px] px-2 py-1 rounded-md bg-[#333] text-white/70 font-medium"
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
