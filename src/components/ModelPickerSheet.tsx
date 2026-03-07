import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ArrowLeft, Zap, Crown, Clock, CheckCircle2, ImagePlus, ChevronRight, Play } from "lucide-react";
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
  images: { models: ["image"], tools: ["image-tool"], modelLabel: "Generation", toolLabel: "Tools" },
  videos: { models: ["video"], tools: ["video-i2v", "video-avatar"], modelLabel: "Text → Video", toolLabel: "Image → Video" },
  chat: { models: ["chat"], tools: [], modelLabel: "Models", toolLabel: "" },
};

const QUALITY_BADGE: Record<string, { label: string; className: string }> = {
  standard: { label: "Standard", className: "bg-secondary text-muted-foreground" },
  high: { label: "High", className: "bg-primary/10 text-primary" },
  ultra: { label: "Ultra", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

interface ModelMediaRecord {
  model_id: string;
  media_url: string;
  media_type: "image" | "video";
}

const ModelPickerSheet = ({ open, onClose, onSelect, mode, selectedModelId }: ModelPickerSheetProps) => {
  const [tab, setTab] = useState<"models" | "tools">("models");
  const [search, setSearch] = useState("");
  const [detailModel, setDetailModel] = useState<ModelDetail | null>(null);
  const [mediaMap, setMediaMap] = useState<Record<string, ModelMediaRecord>>({});

  const types = MODE_TYPES[mode];
  const hasTools = types.tools.length > 0;

  // Load media from Supabase
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

  const filtered = useMemo(() => {
    if (!search.trim()) return allModels;
    const q = search.toLowerCase();
    return allModels.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }, [allModels, search]);

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
    setSearch("");
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* ═══ Top Bar ═══ */}
          <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => {
                  if (detailModel) {
                    setDetailModel(null);
                  } else {
                    onClose();
                    setSearch("");
                  }
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{detailModel ? "Back" : "Back"}</span>
              </button>
              <div className="flex-1" />
              <h1 className="font-display text-lg font-bold text-foreground">
                {detailModel ? detailModel.name : "Choose Model"}
              </h1>
              <div className="flex-1" />
            </div>
          </div>

          {detailModel ? (
            /* ═══ DETAIL VIEW ═══ */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Media preview */}
                {mediaMap[detailModel.id] && (
                  <div className="rounded-2xl overflow-hidden border border-border aspect-video bg-secondary">
                    {mediaMap[detailModel.id].media_type === "video" ? (
                      <video
                        src={mediaMap[detailModel.id].media_url}
                        className="w-full h-full object-cover"
                        autoPlay muted loop playsInline
                      />
                    ) : (
                      <img
                        src={mediaMap[detailModel.id].media_url}
                        alt={detailModel.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="font-display text-2xl font-bold text-foreground">{detailModel.name}</h2>
                      <p className="text-sm text-muted-foreground">{detailModel.description}</p>
                    </div>
                    <div className="shrink-0">
                      {detailModel.credits > 0 ? (
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">{detailModel.credits}</span>
                          <span className="text-xs text-muted-foreground ml-1">credits</span>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-semibold">Free</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {detailModel.speed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground">
                        {detailModel.speed === "fast" ? <Zap className="w-3 h-3 text-amber-500" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                        {detailModel.speed === "fast" ? "Fast" : detailModel.speed === "slow" ? "Slow" : "Standard"}
                      </span>
                    )}
                    {detailModel.quality && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${QUALITY_BADGE[detailModel.quality].className}`}>
                        {detailModel.quality === "ultra" ? <Crown className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {QUALITY_BADGE[detailModel.quality].label}
                      </span>
                    )}
                    {detailModel.modes.map(m => (
                      <span key={m} className="px-3 py-1.5 rounded-full bg-accent text-xs text-accent-foreground font-medium">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{detailModel.longDescription}</p>
                </div>

                {/* Image Requirements */}
                {detailModel.acceptsImages && (
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-primary" />
                      Image Input
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-secondary/50 text-center">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className={`text-sm font-semibold ${detailModel.requiresImage ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                          {detailModel.requiresImage ? "Required" : "Optional"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/50 text-center">
                        <p className="text-xs text-muted-foreground">Max Images</p>
                        <p className="text-sm font-semibold text-foreground">{detailModel.maxImages}</p>
                      </div>
                    </div>
                    {detailModel.inputLabels && (
                      <div className="space-y-1.5 pt-2">
                        {detailModel.inputLabels.map((label, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                            <span className="text-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailModel.notes && (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground/80">💡 {detailModel.notes}</p>
                  </div>
                )}

                <button
                  onClick={() => handleSelect(detailModel)}
                  className={`w-full py-3.5 rounded-2xl font-medium text-sm transition-colors ${
                    selectedModelId === detailModel.id
                      ? "bg-secondary text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {selectedModelId === detailModel.id ? "✓ Currently Selected" : `Select ${detailModel.name}`}
                </button>
              </div>
            </div>
          ) : (
            /* ═══ LIST VIEW ═══ */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">

                {/* Tabs */}
                {hasTools && (
                  <div className="flex gap-1 p-1 rounded-2xl bg-secondary">
                    <button
                      onClick={() => setTab("models")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "models" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {types.modelLabel}
                    </button>
                    <button
                      onClick={() => setTab("tools")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "tools" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {types.toolLabel}
                    </button>
                  </div>
                )}

                {/* Grid */}
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">No models found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.map(model => {
                      const isSelected = selectedModelId === model.id;
                      const media = mediaMap[model.id];

                      return (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`group relative rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/30 hover:shadow-md"
                          }`}
                          onClick={() => handleSelect(model)}
                        >
                          {/* Media thumbnail */}
                          <div className="aspect-square bg-secondary relative overflow-hidden">
                            {media ? (
                              media.media_type === "video" ? (
                                <>
                                  <video
                                    src={media.media_url}
                                    className="w-full h-full object-cover"
                                    muted loop playsInline
                                    onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                    onMouseOut={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center group-hover:opacity-0 transition-opacity">
                                      <Play className="w-4 h-4 text-foreground fill-foreground" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img
                                  src={media.media_url}
                                  alt={model.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-3xl opacity-20">🎨</span>
                              </div>
                            )}

                            {/* Badges overlay */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {model.speed === "fast" && (
                                <span className="w-5 h-5 rounded-md bg-background/70 backdrop-blur-sm flex items-center justify-center">
                                  <Zap className="w-3 h-3 text-amber-500" />
                                </span>
                              )}
                              {model.quality === "ultra" && (
                                <span className="w-5 h-5 rounded-md bg-background/70 backdrop-blur-sm flex items-center justify-center">
                                  <Crown className="w-3 h-3 text-amber-500" />
                                </span>
                              )}
                            </div>

                            {/* Selected indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}

                            {/* Details button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setDetailModel(model); }}
                              className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
                            >
                              Details
                            </button>
                          </div>

                          {/* Info */}
                          <div className="p-2.5">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="text-xs font-semibold text-foreground truncate">{model.name}</h3>
                              {model.credits > 0 ? (
                                <span className="shrink-0 text-[10px] font-bold text-primary">{model.credits}</span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-bold text-green-600 dark:text-green-400">Free</span>
                              )}
                            </div>
                            {model.requiresImage && (
                              <span className="text-[9px] text-primary font-medium flex items-center gap-0.5 mt-0.5">
                                <ImagePlus className="w-2.5 h-2.5" />
                                {model.maxImages > 1 ? `${model.maxImages} images` : "1 image"}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
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
