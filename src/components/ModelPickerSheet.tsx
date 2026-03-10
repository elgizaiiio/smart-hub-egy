import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { type ModelDetail, type ModelType } from "@/lib/modelDetails";
import { useDynamicModels } from "@/hooks/useModels";
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

const MODE_TYPES: Record<PickerMode, {models: ModelType[];tools: ModelType[];modelLabel: string;toolLabel: string;}> = {
  images: { models: ["image"], tools: ["image-tool"], modelLabel: "Models", toolLabel: "Tools" },
  videos: { models: ["video"], tools: [], modelLabel: "Models", toolLabel: "" },
  chat: { models: ["chat"], tools: [], modelLabel: "Models", toolLabel: "" }
};

// Logos and badges are now dynamic from model.iconUrl and model.badges
// These empty maps are kept as fallbacks
const MODEL_LOGOS: Record<string, string> = {};
const MODEL_BADGES: Record<string, string[]> = {};

// NEW_MODELS and FEATURED_IMAGE_IDS are now dynamic via model.badges
const NEW_MODELS: string[] = [];
const FEATURED_IMAGE_IDS: string[] = [];


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
        data.forEach((r: ModelMediaRecord) => {map[r.model_id] = r;});
        setMediaMap(map);
      }
    };
    load();
  }, [open]);

  const { models: dynamicModels } = useDynamicModels();
  const allModels = useMemo(() => {
    const typeList = tab === "models" ? types.models : types.tools;
    return dynamicModels.filter((m) => typeList.includes(m.type));
  }, [tab, types, dynamicModels]);

  // Split featured vs other for image models
  const featuredModels = useMemo(() => {
    if (mode !== "images" || tab !== "models") return [];
    return allModels.filter((m) => FEATURED_IMAGE_IDS.includes(m.id));
  }, [allModels, mode, tab]);

  const otherModels = useMemo(() => {
    if (mode !== "images" || tab !== "models") return allModels;
    return allModels.filter((m) => !FEATURED_IMAGE_IDS.includes(m.id));
  }, [allModels, mode, tab]);

  const handleSelect = (model: ModelDetail) => {
    let cust: Record<string, any> | undefined;
    if (model.customization) {
      cust = typeof model.customization === 'string' ? JSON.parse(model.customization as string) : model.customization;
    }
    onSelect({
      id: model.id,
      name: model.name,
      credits: model.credits.toString(),
      requiresImage: model.requiresImage,
      category: model.type.includes("tool") || model.type.includes("i2v") || model.type.includes("avatar") ? "tool" : "model",
      customization: cust,
      iconUrl: model.iconUrl,
      badges: model.badges,
    });
    onClose();
    setDetailModel(null);
  };

  if (!open) return null;

  const renderModelRow = (model: ModelDetail, showBorder = true) => {
    const isSelected = selectedModelId === model.id;
    const logo = model.iconUrl || MODEL_LOGOS[model.id];
    const badges = model.badges || MODEL_BADGES[model.id] || [];
    const isNew = (model.badges || []).includes("NEW") || NEW_MODELS.includes(model.id);
    const isFree = model.credits === 0;

    return (
      <motion.button
        key={model.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleSelect(model)}
        className={`w-full text-left transition-all group ${
        showBorder ? "border-b border-border/50" : ""}`
        }>
        
        <div className={`relative flex items-start gap-3 px-4 py-4 ${
        isSelected ? "bg-primary/5" : "hover:bg-muted/40"}`
        }>
          {/* Logo */}
          <div className="shrink-0 mt-0.5">
            {logo ?
            <img
              src={logo}
              alt=""
              className="w-6 h-6 rounded-md object-contain" /> :


            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">AI</span>
              </div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-foreground">{model.name}</span>
              {isNew &&
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-warning text-black font-bold uppercase tracking-wide">
                  New
                </span>
              }
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {model.description}
            </p>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {badges.map((badge) =>
              <span
                key={badge}
                className="text-[10px] px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium">
                
                  {badge}
                </span>
              )}
            </div>
          </div>

          {/* Price badge */}
          <div className="shrink-0">
            <span className="text-[10px] px-2 py-1 rounded-md font-semibold border border-border text-muted-foreground">
              {isFree ? "FREE" : `${model.credits} MC`}
            </span>
          </div>
        </div>
      </motion.button>);

  };

  // Video & Images mode: bottom sheet popup
  if (mode === "videos" || mode === "images") {
    return createPortal(
      <AnimatePresence>
        {open &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
          
            <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl border-t border-border max-h-[85vh] flex flex-col">
            
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4">
                




              
                <h2 className="text-lg font-bold text-foreground px-[147px]">Models</h2>
                




              
              </div>

              {/* Model list */}
              <div className="flex-1 overflow-y-auto">
                {mode === "images" && tab === "models" ? (
                  <>
                    {featuredModels.map((model, i) => renderModelRow(model, i < featuredModels.length - 1))}
                    {otherModels.length > 0 && (
                      <div className="border-t border-border">
                        {otherModels.map((model, i) => renderModelRow(model, i < otherModels.length - 1))}
                      </div>
                    )}
                  </>
                ) : (
                  allModels.map((model, i) => renderModelRow(model, i < allModels.length - 1))
                )}
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>,
      document.body
    );
  }

  // Chat mode: full-screen sheet
  return createPortal(
    <AnimatePresence>
      {open &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col">
        
          {/* Top Bar */}
          <div className="shrink-0 bg-background sticky top-0 z-10">
            <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
              <button
              onClick={() => {if (detailModel) setDetailModel(null);else onClose();}}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 text-center">
                <h1 className="font-display text-base font-bold text-foreground">Models</h1>
              </div>

              <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            {hasTools && !detailModel &&
          <div className="max-w-2xl mx-auto px-4 pb-2">
                <div className="flex bg-secondary rounded-full p-1">
                  {["Image", "Tools"].map((label, i) => {
                const isActive = i === 0 && tab === "models" || i === 1 && tab === "tools";
                return (
                  <button
                    key={label}
                    onClick={() => setTab(i === 0 ? "models" : "tools")}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`
                    }>
                    
                        {label}
                      </button>);

              })}
                </div>
              </div>
          }
          </div>

          {detailModel ? (
        /* DETAIL VIEW */
        <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {mediaMap[detailModel.id] &&
            <div className="rounded-2xl overflow-hidden aspect-video bg-secondary">
                    {mediaMap[detailModel.id].media_type === "video" ?
              <video src={mediaMap[detailModel.id].media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline /> :

              <img src={mediaMap[detailModel.id].media_url} alt={detailModel.name} className="w-full h-full object-cover" />
              }
                  </div>
            }

                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-foreground">{detailModel.name}</h2>
                  {detailModel.credits > 0 ?
              <span className="text-lg font-bold text-primary">{detailModel.credits} MC</span> :

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-semibold">Free</span>
              }
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{detailModel.longDescription}</p>

                {(detailModel.badges || []).length > 0 &&
            <div className="flex gap-2 flex-wrap">
                    {(detailModel.badges || []).map((badge) =>
              <span key={badge} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                        {badge}
                      </span>
              )}
                  </div>
            }

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
                      {detailModel.acceptsImages &&
                  <tr className="border-b border-border">
                          <td className="px-4 py-3 text-muted-foreground">Max Images</td>
                          <td className="px-4 py-3 text-foreground font-medium text-right">{detailModel.maxImages}</td>
                        </tr>
                  }
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
              selectedModelId === detailModel.id ?
              "bg-secondary text-muted-foreground" :
              "bg-primary text-primary-foreground hover:bg-primary/90"}`
              }>
              
                  {selectedModelId === detailModel.id ? "Currently Selected" : `Select ${detailModel.name}`}
                </button>
              </div>
            </div>) : (

        /* LIST VIEW */
        <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
            <div>
                    {allModels.length === 0 ?
              <div className="text-center py-16">
                        <p className="text-muted-foreground text-sm">No models found.</p>
                      </div> :

              allModels.map((model, i) => renderModelRow(model, i < allModels.length - 1))
              }
                  </div>
              </div>
            </div>)
        }
        </motion.div>
      }
    </AnimatePresence>,
    document.body
  );
};

export default ModelPickerSheet;