import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  credits: string;
  description?: string;
  requiresImage?: boolean;
  category?: "model" | "tool";
}

type ModelMode = "chat" | "images" | "videos" | "files" | "code";

const CHAT_MODELS: ModelOption[] = [
  { id: "google/gemini-3-flash-preview", name: "Megsy V1", credits: "Free" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", credits: "Free" },
  { id: "openai/gpt-5", name: "GPT-5", credits: "Free" },
  { id: "x-ai/grok-3", name: "Grok 3", credits: "Free" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", credits: "Free" },
];

export const IMAGE_MODELS: ModelOption[] = [
  { id: "megsy-v1-img", name: "Megsy v1", credits: "4", category: "model" },
  { id: "gpt-image", name: "GPT Image 1.5", credits: "5", category: "model" },
  { id: "nano-banana-2", name: "Nano Banana 2", credits: "4", category: "model" },
  { id: "flux-kontext", name: "FLUX Kontext", credits: "3", category: "model" },
  { id: "ideogram-3", name: "Ideogram 3", credits: "3", category: "model" },
  { id: "seedream-5-lite", name: "Seedream 5 Lite", credits: "2", category: "model" },
  { id: "grok-imagine", name: "Grok Imagine", credits: "3", category: "model" },
  { id: "recraft-v4", name: "Recraft V4", credits: "3", category: "model" },
  { id: "flux-2-pro", name: "FLUX 2 Pro", credits: "5", category: "model" },
  { id: "seedream-4", name: "Seedream 4", credits: "2", category: "model" },
  { id: "imagineart-1.5", name: "ImagineArt 1.5", credits: "2", category: "model" },
  { id: "fal-hidream-i1", name: "HiDream I1", credits: "3", category: "model" },
  { id: "fal-aura-v2", name: "Aura Flow v2", credits: "2", category: "model" },
  { id: "fal-stable-cascade", name: "Stable Cascade", credits: "3", category: "model" },
  { id: "fal-omnigen2", name: "OmniGen2", credits: "3", category: "model" },
  { id: "fal-flux-realism", name: "FLUX Realism", credits: "3", category: "model" },
  { id: "logo-creator", name: "Logo Creator", credits: "2", category: "model" },
  { id: "sticker-maker", name: "Sticker Maker", credits: "2", category: "model" },
  { id: "qr-art", name: "QR Art", credits: "2", category: "model" },
  { id: "nano-banana-edit", name: "Nano Banana Edit", credits: "2", category: "tool", requiresImage: true },
  { id: "object-remover", name: "Object Remover", credits: "2", category: "tool", requiresImage: true },
  { id: "watermark-remover", name: "Watermark Remover", credits: "2", category: "tool", requiresImage: true },
  { id: "image-extender", name: "Image Extender", credits: "2", category: "tool", requiresImage: true },
  { id: "flux-pro-editor", name: "FLUX Pro Editor", credits: "2", category: "tool", requiresImage: true },
  { id: "image-variations", name: "Image Variations", credits: "2", category: "tool", requiresImage: true },
  { id: "photo-colorizer", name: "Photo Colorizer", credits: "1", category: "tool", requiresImage: true },
  { id: "photo-to-sketch", name: "Photo to Sketch", credits: "1", category: "tool", requiresImage: true },
  { id: "bg-remover", name: "Background Remover", credits: "1", category: "tool", requiresImage: true },
  { id: "photo-to-cartoon", name: "Photo to Cartoon", credits: "3", category: "tool", requiresImage: true },
  { id: "4k-upscaler", name: "4K Upscaler", credits: "2", category: "tool", requiresImage: true },
  { id: "face-enhancer", name: "Face Enhancer", credits: "1", category: "tool", requiresImage: true },
  { id: "product-photo", name: "Product Photo", credits: "2", category: "tool", requiresImage: true },
  { id: "bg-replacer", name: "Background Replacer", credits: "2", category: "tool", requiresImage: true },
  { id: "ai-headshot", name: "AI Headshot", credits: "2", category: "tool", requiresImage: true },
  { id: "creative-upscaler", name: "Creative Upscaler", credits: "2", category: "tool", requiresImage: true },
  { id: "old-photo-restorer", name: "Old Photo Restorer", credits: "2", category: "tool", requiresImage: true },
  { id: "passport-photo", name: "Passport Photo", credits: "2", category: "tool", requiresImage: true },
  { id: "style-transfer", name: "Style Transfer", credits: "2", category: "tool", requiresImage: true },
  { id: "ai-relighting", name: "AI Relighting", credits: "3", category: "tool", requiresImage: true },
];

export const VIDEO_MODELS: ModelOption[] = [
  { id: "megsy-video", name: "Megsy Video", credits: "6", category: "model" },
  { id: "veo-3.1", name: "Google Veo 3.1", credits: "30", category: "model" },
  { id: "veo-3.1-fast", name: "Google Veo 3.1 Fast", credits: "12", category: "model" },
  { id: "kling-3-pro", name: "Kling 3.0 Pro", credits: "20", category: "model" },
  { id: "openai-sora", name: "OpenAI Sora", credits: "8", category: "model" },
  { id: "pika-2.2", name: "Pika 2.2", credits: "8", category: "model" },
  { id: "luma-dream", name: "Luma Dream Machine", credits: "8", category: "model" },
  { id: "seedance-pro", name: "Seedance Pro", credits: "5", category: "model" },
  { id: "kling-o1", name: "Kling O1", credits: "15", category: "model" },
  { id: "pixverse-5.5", name: "PixVerse v5.5", credits: "8", category: "model" },
  { id: "wan-2.6", name: "WAN 2.6", credits: "10", category: "model" },
  { id: "megsy-video-i2v", name: "Megsy Video I2V", credits: "6", category: "tool", requiresImage: true },
  { id: "kling-3-pro-i2v", name: "Kling 3.0 Pro I2V", credits: "20", category: "tool", requiresImage: true },
  { id: "veo-3.1-fast-i2v", name: "Veo 3.1 Fast I2V", credits: "12", category: "tool", requiresImage: true },
  { id: "openai-sora-i2v", name: "OpenAI Sora I2V", credits: "8", category: "tool", requiresImage: true },
  { id: "kling-o1-i2v", name: "Kling O1 I2V", credits: "15", category: "tool", requiresImage: true },
  { id: "pixverse-5.5-i2v", name: "PixVerse v5.5 I2V", credits: "8", category: "tool", requiresImage: true },
  { id: "wan-2.6-i2v", name: "WAN 2.6 I2V", credits: "10", category: "tool", requiresImage: true },
  { id: "wan-flf", name: "WAN First-Last-Frame", credits: "6", category: "tool", requiresImage: true },
  { id: "kling-avatar-pro", name: "Kling Avatar V2 Pro", credits: "10", category: "tool", requiresImage: true },
  { id: "kling-avatar-std", name: "Kling Avatar V2 Standard", credits: "5", category: "tool", requiresImage: true },
  { id: "sadtalker", name: "SadTalker", credits: "2", category: "tool", requiresImage: true },
  { id: "sync-lipsync", name: "Sync Lipsync V2", credits: "50", category: "tool", requiresImage: true },
  { id: "pika-magic", name: "Pika Magic Effects", credits: "8", category: "tool", requiresImage: true },
  { id: "luma-modify", name: "Luma Video Modify", credits: "8", category: "tool", requiresImage: true },
  { id: "pixverse-effects", name: "PixVerse Effects", credits: "6", category: "tool", requiresImage: true },
  { id: "perf-capture", name: "Performance Capture", credits: "2", category: "tool", requiresImage: true },
  { id: "dreamactor-v2", name: "DreamActor v2", credits: "8", category: "tool", requiresImage: true },
];

const MODELS: Record<ModelMode, ModelOption[]> = {
  chat: CHAT_MODELS,
  images: IMAGE_MODELS,
  videos: VIDEO_MODELS,
  files: CHAT_MODELS.slice(0, 3),
  code: [
    { id: "x-ai/grok-3", name: "Grok 3", credits: "2" },
    { id: "openai/gpt-5", name: "GPT-5", credits: "2" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", credits: "1" },
  ],
};

export const getDefaultModel = (mode: ModelMode): ModelOption => MODELS[mode]?.[0] || CHAT_MODELS[0];
export const getModelsForMode = (mode: ModelMode): ModelOption[] => MODELS[mode] || CHAT_MODELS;

interface ModelSelectorProps {
  mode: ModelMode;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  showCategories?: boolean;
  centerDropdown?: boolean;
}

const ModelSelector = ({ mode, selectedModel, onModelChange, showCategories, centerDropdown }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"model" | "tool">("model");
  const models = MODELS[mode] || CHAT_MODELS;

  const filteredModels = showCategories
    ? models.filter(m => (m.category || "model") === tab)
    : models;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="fancy-btn !py-1.5 !px-4"
      >
        <span className="fold" />
        <div className="points_wrapper">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="point" />
          ))}
        </div>
        <span className="inner !text-xs !gap-2">
          {selectedModel.name}
          <ChevronDown className="w-3 h-3" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={`absolute top-full mt-2 z-40 glass-panel p-1 min-w-[260px] max-h-[400px] overflow-y-auto ${
                centerDropdown ? "left-1/2 -translate-x-1/2" : "right-0"
              }`}
            >
              {showCategories && (
                <div className="flex gap-1 p-1 mb-1">
                  <button
                    onClick={() => setTab("model")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "model" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    Models
                  </button>
                  <button
                    onClick={() => setTab("tool")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "tool" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    Tools
                  </button>
                </div>
              )}
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    m.id === selectedModel.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-foreground text-xs font-medium">{m.name}</span>
                    {m.requiresImage && <span className="text-[10px] text-primary">Requires image</span>}
                  </div>
                  <span className="text-[10px] opacity-60">
                    {m.credits === "Free" ? "Free" : `${m.credits} cr`}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;
