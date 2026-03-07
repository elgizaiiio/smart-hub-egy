import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ArrowLeft, Zap, Crown, Clock, CheckCircle2, ImagePlus, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { ALL_MODEL_DETAILS, type ModelDetail, type ModelType } from "@/lib/modelDetails";
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
  ultra: { label: "Ultra", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
};

const ModelPickerSheet = ({ open, onClose, onSelect, mode, selectedModelId }: ModelPickerSheetProps) => {
  const [tab, setTab] = useState<"models" | "tools">("models");
  const [search, setSearch] = useState("");
  const [detailModel, setDetailModel] = useState<ModelDetail | null>(null);

  const types = MODE_TYPES[mode];
  const hasTools = types.tools.length > 0;

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
          <div className="shrink-0 border-b border-border">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
              {detailModel ? (
                <button
                  onClick={() => setDetailModel(null)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <h1 className="font-display text-lg font-bold text-foreground">Choose Model</h1>
              )}
              <div className="flex-1" />
              <button
                onClick={() => { onClose(); setDetailModel(null); setSearch(""); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {detailModel ? (
            /* ═══════════════════════════════════════════ */
            /* ═══ DETAIL VIEW ═══ */
            /* ═══════════════════════════════════════════ */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
                        {detailModel.speed === "fast" ? <Zap className="w-3 h-3 text-yellow-500" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
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
                      Image Input Requirements
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-28 shrink-0">Status:</span>
                        <span className={`font-medium ${detailModel.requiresImage ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                          {detailModel.requiresImage ? "Required" : "Optional"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-28 shrink-0">Max images:</span>
                        <span className="text-foreground font-medium">{detailModel.maxImages}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-28 shrink-0">Formats:</span>
                        <span className="text-foreground">{detailModel.acceptedMimeTypes.map(t => t.split("/")[1].toUpperCase()).join(", ")}</span>
                      </div>
                      {detailModel.inputLabels && detailModel.inputLabels.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input Slots</span>
                          <div className="mt-2 space-y-1">
                            {detailModel.inputLabels.map((label, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                <span className="text-foreground">{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {detailModel.notes && (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground/80">💡 {detailModel.notes}</p>
                  </div>
                )}

                {/* Select Button */}
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
            /* ═══════════════════════════════════════════ */
            /* ═══ LIST VIEW ═══ */
            /* ═══════════════════════════════════════════ */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search models..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/30 transition-colors"
                  />
                </div>

                {/* Tabs */}
                {hasTools && (
                  <div className="flex gap-1 p-1 rounded-2xl bg-secondary">
                    <button
                      onClick={() => setTab("models")}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === "models" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {types.modelLabel}
                    </button>
                    <button
                      onClick={() => setTab("tools")}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === "tools" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map(model => {
                      const isSelected = selectedModelId === model.id;
                      return (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group relative rounded-2xl border p-4 transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                          }`}
                          onClick={() => handleSelect(model)}
                        >
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground truncate">{model.name}</h3>
                                {isSelected && (
                                  <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {model.credits > 0 ? (
                                <span className="text-xs font-semibold text-primary">{model.credits} cr</span>
                              ) : (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Free</span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{model.description}</p>

                          {/* Bottom row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {model.speed === "fast" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">
                                  <Zap className="w-2.5 h-2.5 text-yellow-500" /> Fast
                                </span>
                              )}
                              {model.quality === "ultra" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                                  <Crown className="w-2.5 h-2.5" /> Ultra
                                </span>
                              )}
                              {model.requiresImage && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                                  <ImagePlus className="w-2.5 h-2.5" />
                                  {model.maxImages > 1 ? `1-${model.maxImages} imgs` : "1 img"}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDetailModel(model); }}
                              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Details <ChevronRight className="w-3 h-3" />
                            </button>
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
