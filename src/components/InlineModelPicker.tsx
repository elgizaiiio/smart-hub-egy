import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ALL_MODEL_DETAILS, type ModelDetail } from "@/lib/modelDetails";
import { supabase } from "@/integrations/supabase/client";
import type { ModelOption } from "./ModelSelector";

interface ModelMediaRecord {
  model_id: string;
  media_url: string;
  media_type: "image" | "video";
}

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
  "ideogram-3": { letter: "△", gradient: "from-pink-400 to-rose-500" },
  "flux-kontext": { letter: "△", gradient: "from-cyan-400 to-blue-500" },
  "flux-2-pro": { letter: "△", gradient: "from-cyan-400 to-blue-500" },
  "grok-imagine": { letter: "◇", gradient: "from-purple-400 to-violet-500" },
  "recraft-v4": { letter: "R", gradient: "from-orange-400 to-red-500" },
  "lucid-origin": { letter: "L", gradient: "from-indigo-400 to-purple-500" },
  "imagineart-1.5": { letter: "I", gradient: "from-teal-400 to-cyan-500" },
  "megsy-v1-img": { letter: "M", gradient: "from-primary to-primary/70" },
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
  const [mediaMap, setMediaMap] = useState<Record<string, ModelMediaRecord>>({});

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase.from("model_media").select("model_id, media_url, media_type");
      if (data) {
        const map: Record<string, ModelMediaRecord> = {};
        data.forEach((r: ModelMediaRecord) => { map[r.model_id] = r; });
        setMediaMap(map);
      }
    };
    load();
  }, [open]);

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
                    const badges = MODEL_BADGES[model.id] || [];
                    const iconInfo = MODEL_ICONS[model.id] || { letter: "AI", gradient: "from-gray-400 to-gray-500" };
                    const media = mediaMap[model.id];

                    return (
                      <motion.button
                        key={model.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect(model)}
                        className={`relative flex flex-col p-4 rounded-xl text-left transition-all overflow-hidden ${
                          isSelected
                            ? "bg-[#3d5a3d] border border-[#5a8a5a]"
                            : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                        }`}
                      >
                        {/* Preview image in background (if available) */}
                        {media && (
                          <div className="absolute right-0 bottom-0 w-24 h-24 opacity-40">
                            <img
                              src={media.media_url}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-transparent to-transparent" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Top row: Icon + Name + Badges */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${iconInfo.gradient} flex items-center justify-center`}>
                                <span className="text-[10px] font-bold text-black">{iconInfo.letter}</span>
                              </div>
                              <span className="text-sm font-semibold text-white">{model.name}</span>
                              {isNew && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-black font-bold uppercase">
                                  New
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70 font-medium shrink-0">
                              {model.credits > 0 ? `${model.credits} MC` : "FREE"}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-white/50 line-clamp-2 mb-2.5 pr-20">
                            {model.description}
                          </p>

                          {/* Badges */}
                          {badges.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/60 font-medium"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
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
