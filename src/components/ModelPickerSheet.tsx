import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, HelpCircle, Star, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import { ALL_MODEL_DETAILS, type ModelDetail, type ModelType } from "@/lib/modelDetails";
import { supabase } from "@/integrations/supabase/client";
import type { ModelOption } from "./ModelSelector";

type PickerMode = "images" | "videos" | "chat";

interface ModelPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (model: ModelOption) => void;
  mode: PickerMode;
  selectedModelId: string;
}

const MODE_TYPES: Record<PickerMode, { models: ModelType[]; tools: ModelType[]; modelLabel: string; toolLabel: string }> = {
  images: { models: ["image"], tools: ["image-tool"], modelLabel: "Models", toolLabel: "Tools" },
  videos: { models: ["video"], tools: ["video-i2v", "video-avatar"], modelLabel: "Models", toolLabel: "Tools" },
  chat: { models: ["chat"], tools: [], modelLabel: "Models", toolLabel: "" },
};

// Featured model IDs (shown at top)
const FEATURED_IMAGE_IDS = [
  "nano-banana-2",
  "seedream-4",
  "lucid-origin",
  "flux-2-pro",
  "gpt-image",
  "nano-banana-pro",
];

// Capability badges per model
const MODEL_BADGES: Record<string, string[]> = {
  "nano-banana-2": ["Image Ref"],
  "seedream-4": ["Image Ref"],
  "lucid-origin": ["Style Ref", "Content Ref"],
  "flux-2-pro": ["Image Guidance"],
  "gpt-image": ["Image Ref"],
  "nano-banana-pro": ["Image Ref"],
  "seedream-4-0": ["Image Ref"],
  "megsy-v1-img": ["Image Ref"],
  "lucid-realism": ["Style Ref", "Content Ref"],
  "ideogram-3": [],
  "gpt-image-1": ["Image Ref"],
  "flux-kontext": ["Image Ref"],
  "flux-kontext-std": ["Image Ref"],
  "flux-dev": ["Style Ref", "Content Ref", "Elements"],
  "flux-schnell": ["Style Ref", "Content Ref"],
  "phoenix-1": ["Image to Image", "Style Ref", "Content Ref", "Character Ref"],
  "phoenix-0.9": ["Image to Image", "Style Ref", "Content Ref", "Character Ref"],
};

// Provider icons
const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  "nano-banana-2": <span className="text-[10px]">🍌</span>,
  "seedream-4": <span className="text-[10px]">🌊</span>,
  "lucid-origin": <span className="text-[10px]">🔮</span>,
  "flux-2-pro": <span className="text-[10px]">⚡</span>,
  "gpt-image": <span className="text-[10px]">🤖</span>,
  "nano-banana-pro": <span className="text-[10px]">🍌</span>,
};

interface ModelMediaRecord {
  model_id: string;
  media_url: string;
  media_type: "image" | "video";
}

const ModelPickerSheet = ({ open, onClose, onSelect, mode, selectedModelId }: ModelPickerSheetProps) => {
  const [tab, setTab] = useState<"models" | "tools">("models");
  const [detailModel, setDetailModel] = useState<ModelDetail | null>(null);
  const [mediaMap, setMediaMap] = useState<Record<string, ModelMediaRecord>>({});

  const types = MODE_TYPES[mode];
  const hasTools = types.tools.length > 0;

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

  const allModels = useMemo(() => {
    const typeList = tab === "models" ? types.models : types.tools;
    return ALL_MODEL_DETAILS.filter(m => typeList.includes(m.type));
  }, [tab, types]);

  // Split featured vs other for image models
  const featuredModels = useMemo(() => {
    if (mode !== "images" || tab !== "models") return [];
    return allModels.filter(m => FEATURED_IMAGE_IDS.includes(m.id));
  }, [allModels, mode, tab]);

  const otherModels = useMemo(() => {
    if (mode !== "images" || tab !== "models") return allModels;
    return allModels.filter(m => !FEATURED_IMAGE_IDS.includes(m.id));
  }, [allModels, mode, tab]);

  const handleSelect = (model: ModelDetail) => {
    onSelect({
      id: model.id,
      name: model.name,
      credits: model.credits.toString(),
      requiresImage: model.requiresImage,
      category: model.type.includes("tool") || model.type.includes("i2v") || model.type.includes("avatar") ? "tool" : "model",
    });
    onClose();
    setDetailModel(null);
  };

  if (!open) return null;

  const renderModelRow = (model: ModelDetail) => {
    const isSelected = selectedModelId === model.id;
    const media = mediaMap[model.id];
    const badges = MODEL_BADGES[model.id] || [];
    const isNew = model.id === "nano-banana-2";

    return (
      <motion.button
        key={model.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => handleSelect(model)}
        className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${
          isSelected
            ? "bg-primary/10 border border-primary/30"
            : "hover:bg-secondary/60 border border-transparent"
        }`}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
          {media ? (
            media.media_type === "video" ? (
              <video src={media.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={media.media_url} alt={model.name} className="w-full h-full object-cover" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-lg opacity-30">AI</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground">{model.name}</span>
            {PROVIDER_ICONS[model.id] && PROVIDER_ICONS[model.id]}
            {isNew && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">New</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{model.description}</p>
          {badges.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {badges.map(badge => (
                <span
                  key={badge}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground">
            {model.credits > 0 ? `${model.credits} MC` : "Free"}
          </span>
          {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
        </div>
      </motion.button>
    );
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Top Bar */}
          <div className="shrink-0 bg-background sticky top-0 z-10 border-b border-border">
            <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
              <button
                onClick={() => { if (detailModel) setDetailModel(null); else onClose(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 text-center">
                <h1 className="font-display text-base font-bold text-foreground">Models</h1>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            {hasTools && !detailModel && (
              <div className="max-w-2xl mx-auto px-4 pb-2">
                <div className="flex bg-secondary rounded-full p-1">
                  {["Image", "Video", "Legacy"].map((label, i) => {
                    const tabKey = i === 0 ? "models" : i === 1 ? "tools" : "models";
                    const isActive = (i === 0 && tab === "models") || (i === 1 && tab === "tools");
                    if (i === 2 && mode !== "images") return null;
                    return (
                      <button
                        key={label}
                        onClick={() => setTab(i === 0 ? "models" : "tools")}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {detailModel ? (
            /* DETAIL VIEW */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {mediaMap[detailModel.id] && (
                  <div className="rounded-2xl overflow-hidden aspect-video bg-secondary">
                    {mediaMap[detailModel.id].media_type === "video" ? (
                      <video src={mediaMap[detailModel.id].media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={mediaMap[detailModel.id].media_url} alt={detailModel.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-foreground">{detailModel.name}</h2>
                  {detailModel.credits > 0 ? (
                    <span className="text-lg font-bold text-primary">{detailModel.credits} MC</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-semibold">Free</span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{detailModel.longDescription}</p>

                {/* Badges */}
                {MODEL_BADGES[detailModel.id]?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {MODEL_BADGES[detailModel.id].map(badge => (
                      <span key={badge} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* Specs */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground">Speed</td>
                        <td className="px-4 py-3 text-foreground font-medium text-right capitalize">{detailModel.speed || "Standard"}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground">Quality</td>
                        <td className="px-4 py-3 text-foreground font-medium text-right capitalize">{detailModel.quality || "Standard"}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground">Modes</td>
                        <td className="px-4 py-3 text-foreground font-medium text-right">{detailModel.modes.join(", ")}</td>
                      </tr>
                      {detailModel.acceptsImages && (
                        <>
                          <tr className="border-b border-border">
                            <td className="px-4 py-3 text-muted-foreground">Max Images</td>
                            <td className="px-4 py-3 text-foreground font-medium text-right">{detailModel.maxImages}</td>
                          </tr>
                        </>
                      )}
                      <tr>
                        <td className="px-4 py-3 text-muted-foreground">MC</td>
                        <td className="px-4 py-3 text-primary font-bold text-right">{detailModel.credits > 0 ? `${detailModel.credits} per request` : "Free"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => handleSelect(detailModel)}
                  className={`w-full py-3.5 rounded-2xl font-medium text-sm transition-colors ${
                    selectedModelId === detailModel.id
                      ? "bg-secondary text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {selectedModelId === detailModel.id ? "Currently Selected" : `Select ${detailModel.name}`}
                </button>
              </div>
            </div>
          ) : (
            /* LIST VIEW - Leonardo style with Featured/Other sections */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-3">
                {mode === "images" && tab === "models" ? (
                  <>
                    {/* Featured Section */}
                    {featuredModels.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Featured</span>
                        </div>
                        <div className="space-y-1">
                          {featuredModels.map(model => renderModelRow(model))}
                        </div>
                      </div>
                    )}

                    {/* Separator */}
                    <div className="border-t border-border my-4" />

                    {/* Other Models Section */}
                    {otherModels.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Models</span>
                        </div>
                        <div className="space-y-1">
                          {otherModels.map(model => renderModelRow(model))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Non-image or tools: simple list */
                  <div className="space-y-1">
                    {allModels.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-muted-foreground text-sm">No models found.</p>
                      </div>
                    ) : (
                      allModels.map(model => renderModelRow(model))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModelPickerSheet;
