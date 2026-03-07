import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Info, ArrowLeft, Image, Video, Zap, Crown, Clock, CheckCircle2, ImagePlus } from "lucide-react";
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

const MODE_TYPES: Record<PickerMode, { models: ModelType[]; tools: ModelType[] }> = {
  images: { models: ["image"], tools: ["image-tool"] },
  videos: { models: ["video"], tools: ["video-i2v", "video-avatar"] },
  chat: { models: ["chat"], tools: [] },
};

const SPEED_ICONS: Record<string, { icon: typeof Zap; label: string }> = {
  fast: { icon: Zap, label: "Fast" },
  standard: { icon: Clock, label: "Standard" },
  slow: { icon: Clock, label: "Slow" },
};

const QUALITY_COLORS: Record<string, string> = {
  standard: "text-muted-foreground",
  high: "text-primary",
  ultra: "text-yellow-500",
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
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col rounded-t-2xl border-t bg-background sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:top-auto sm:w-full sm:max-w-lg sm:rounded-2xl sm:border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              {detailModel ? (
                <button onClick={() => setDetailModel(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <h3 className="font-display text-base font-semibold text-foreground">Choose Model</h3>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {detailModel ? (
              /* ══════ Detail View ══════ */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{detailModel.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{detailModel.description}</p>
                  </div>
                  {detailModel.credits > 0 && (
                    <span className="shrink-0 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {detailModel.credits} credits
                    </span>
                  )}
                  {detailModel.credits === 0 && (
                    <span className="shrink-0 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-semibold">
                      Free
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed">{detailModel.longDescription}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {detailModel.speed && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-foreground">
                      {detailModel.speed === "fast" ? <Zap className="w-3 h-3 text-yellow-500" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                      {detailModel.speed.charAt(0).toUpperCase() + detailModel.speed.slice(1)}
                    </span>
                  )}
                  {detailModel.quality && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium ${QUALITY_COLORS[detailModel.quality]}`}>
                      {detailModel.quality === "ultra" ? <Crown className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {detailModel.quality.charAt(0).toUpperCase() + detailModel.quality.slice(1)} Quality
                    </span>
                  )}
                </div>

                {/* Modes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supported Modes</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailModel.modes.map(m => (
                      <span key={m} className="px-2.5 py-1 rounded-lg bg-accent text-xs text-foreground">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Image Requirements */}
                {detailModel.acceptsImages && (
                  <div className="space-y-2 p-3 rounded-xl bg-secondary/50 border border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ImagePlus className="w-3.5 h-3.5" />
                      Image Input
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-foreground">
                        {detailModel.requiresImage ? "⚠️ Image required" : "📎 Image optional"} — Max {detailModel.maxImages} image{detailModel.maxImages > 1 ? "s" : ""}
                      </p>
                      {detailModel.inputLabels && (
                        <ul className="space-y-0.5 ml-4">
                          {detailModel.inputLabels.map((label, i) => (
                            <li key={i} className="text-muted-foreground text-xs list-disc">{label}</li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Accepts: {detailModel.acceptedMimeTypes.map(t => t.split("/")[1]).join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {detailModel.notes && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground/80">💡 {detailModel.notes}</p>
                  </div>
                )}

                {/* Select button */}
                <button
                  onClick={() => handleSelect(detailModel)}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  {selectedModelId === detailModel.id ? "Currently Selected" : `Select ${detailModel.name}`}
                </button>
              </div>
            ) : (
              /* ══════ List View ══════ */
              <>
                {/* Search */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search models..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Tabs */}
                {hasTools && (
                  <div className="flex gap-1 px-4 pb-2 shrink-0">
                    <button
                      onClick={() => setTab("models")}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${tab === "models" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                    >
                      {mode === "videos" ? "Text → Video" : "Generation"}
                    </button>
                    <button
                      onClick={() => setTab("tools")}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${tab === "tools" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                    >
                      {mode === "videos" ? "Image → Video" : "Tools"}
                    </button>
                  </div>
                )}

                {/* Model list */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
                  {filtered.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No models found.</p>
                  )}
                  {filtered.map(model => (
                    <div
                      key={model.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                        selectedModelId === model.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-accent border border-transparent"
                      }`}
                      onClick={() => handleSelect(model)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{model.name}</span>
                          {model.credits > 0 && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">{model.credits} cr</span>
                          )}
                          {model.credits === 0 && (
                            <span className="shrink-0 text-[10px] text-green-500 font-medium">Free</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{model.description}</p>
                        {model.requiresImage && (
                          <span className="text-[10px] text-primary font-medium">
                            Requires {model.maxImages > 1 ? `1-${model.maxImages} images` : "1 image"}
                          </span>
                        )}
                      </div>

                      {/* Speed/quality indicators */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {model.speed === "fast" && <Zap className="w-3 h-3 text-yellow-500" />}
                        {model.quality === "ultra" && <Crown className="w-3 h-3 text-yellow-500" />}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetailModel(model); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                        >
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModelPickerSheet;
