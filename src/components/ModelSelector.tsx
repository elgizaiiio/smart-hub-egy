import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ModelPickerSheet from "./ModelPickerSheet";

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
  { id: "google/gemini-3-flash-preview", name: "Megsy V1", credits: "" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", credits: "" },
  { id: "openai/gpt-5", name: "GPT-5", credits: "" },
  { id: "x-ai/grok-3", name: "Grok 3", credits: "" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", credits: "" },
];

export const IMAGE_MODELS: ModelOption[] = [
  { id: "megsy-v1-img", name: "Megsy v1", credits: "4", category: "model" },
  { id: "gpt-image", name: "GPT Image 1.5", credits: "5", category: "model" },
  { id: "nano-banana-2", name: "Nano Banana 2", credits: "4", category: "model" },
  { id: "flux-kontext", name: "FLUX Kontext Max", credits: "3", category: "model" },
  { id: "ideogram-3", name: "Ideogram 3", credits: "3", category: "model" },
  { id: "seedream-5-lite", name: "Seedream 5 Lite", credits: "2", category: "model" },
  { id: "recraft-v4", name: "Recraft V4", credits: "3", category: "model" },
  { id: "flux-2-pro", name: "FLUX 2 Pro", credits: "5", category: "model" },
  { id: "seedream-4", name: "Seedream 4.5", credits: "2", category: "model" },
  { id: "grok-imagine", name: "Grok Imagine", credits: "3", category: "model" },
  { id: "imagineart-1.5", name: "ImagineArt 1.5", credits: "2", category: "model" },
  { id: "fal-hidream-i1", name: "HiDream I1 Full", credits: "2", category: "model" },
  { id: "fal-aura-v2", name: "Aura Flow v2", credits: "1", category: "model" },
  { id: "fal-stable-cascade", name: "Stable Cascade", credits: "1", category: "model" },
  { id: "fal-omnigen2", name: "OmniGen2", credits: "2", category: "model" },
  { id: "fal-flux-realism", name: "FLUX Realism", credits: "2", category: "model" },
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
  { id: "bg-remover", name: "Background Remover", credits: "1", category: "tool", requiresImage: true },
  { id: "4k-upscaler", name: "4K Upscaler", credits: "2", category: "tool", requiresImage: true },
  { id: "face-enhancer", name: "Face Enhancer", credits: "1", category: "tool", requiresImage: true },
  { id: "creative-upscaler", name: "Creative Upscaler", credits: "2", category: "tool", requiresImage: true },
  { id: "old-photo-restorer", name: "Old Photo Restorer", credits: "2", category: "tool", requiresImage: true },
  { id: "bg-replacer", name: "Background Replacer", credits: "2", category: "tool", requiresImage: true },
  { id: "style-transfer", name: "Style Transfer", credits: "2", category: "tool", requiresImage: true },
  { id: "ai-relighting", name: "AI Relighting", credits: "3", category: "tool", requiresImage: true },
  { id: "photo-to-cartoon", name: "Photo to Cartoon", credits: "3", category: "tool", requiresImage: true },
  { id: "product-photo", name: "Product Photo", credits: "2", category: "tool", requiresImage: true },
  { id: "ai-headshot", name: "AI Headshot", credits: "2", category: "tool", requiresImage: true },
];

export const VIDEO_MODELS: ModelOption[] = [
  { id: "megsy-video", name: "Megsy Video", credits: "6", category: "model" },
  { id: "veo-3.1", name: "Google Veo 3.1", credits: "30", category: "model" },
  { id: "veo-3.1-fast", name: "Veo 3.1 Fast", credits: "12", category: "model" },
  { id: "kling-3-pro", name: "Kling 3.0 Pro", credits: "20", category: "model" },
  { id: "kling-o1", name: "Kling O1", credits: "15", category: "model" },
  { id: "openai-sora", name: "OpenAI Sora", credits: "8", category: "model" },
  { id: "pika-2.2", name: "Pika 2.2", credits: "8", category: "model" },
  { id: "luma-dream", name: "Luma Dream Machine", credits: "8", category: "model" },
  { id: "seedance-pro", name: "Seedance Pro", credits: "5", category: "model" },
  { id: "wan-2.6", name: "WAN 2.6", credits: "10", category: "model" },
  { id: "pixverse-5.5", name: "PixVerse v5.5", credits: "8", category: "model" },
  { id: "megsy-video-i2v", name: "Megsy Video I2V", credits: "6", category: "tool", requiresImage: true },
  { id: "kling-3-pro-i2v", name: "Kling 3.0 Pro I2V", credits: "20", category: "tool", requiresImage: true },
  { id: "kling-o1-i2v", name: "Kling O1 I2V", credits: "15", category: "tool", requiresImage: true },
  { id: "veo-3.1-fast-i2v", name: "Veo 3.1 Fast I2V", credits: "12", category: "tool", requiresImage: true },
  { id: "openai-sora-i2v", name: "OpenAI Sora I2V", credits: "8", category: "tool", requiresImage: true },
  { id: "pixverse-5.5-i2v", name: "PixVerse v5.5 I2V", credits: "8", category: "tool", requiresImage: true },
  { id: "wan-2.6-i2v", name: "WAN 2.6 I2V", credits: "10", category: "tool", requiresImage: true },
  { id: "wan-flf", name: "WAN First-Last-Frame", credits: "6", category: "tool", requiresImage: true },
  { id: "kling-avatar-pro", name: "Kling Avatar V2 Pro", credits: "10", category: "tool", requiresImage: true },
  { id: "kling-avatar-std", name: "Kling Avatar V2 Std", credits: "5", category: "tool", requiresImage: true },
  { id: "sadtalker", name: "SadTalker", credits: "2", category: "tool", requiresImage: true },
  { id: "sync-lipsync", name: "Sync Lipsync V2", credits: "50", category: "tool", requiresImage: true },
];

const MODELS: Record<ModelMode, ModelOption[]> = {
  chat: CHAT_MODELS,
  images: IMAGE_MODELS,
  videos: VIDEO_MODELS,
  files: CHAT_MODELS.slice(0, 3),
  code: [
    { id: "x-ai/grok-3", name: "Grok 3", credits: "" },
    { id: "openai/gpt-5", name: "GPT-5", credits: "" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", credits: "" },
  ],
};

// Brand icons for chat models
const ModelBrandIcon = ({ modelId }: { modelId: string }) => {
  if (modelId.includes("gemini")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/>
        <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5L12 6z" fill="white"/>
      </svg>
    );
  }
  if (modelId.includes("gpt")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="12" cy="12" r="10" fill="#10A37F"/>
        <path d="M12 7v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (modelId.includes("grok")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" className="text-foreground"/>
        <path d="M8 12h8M12 8v8" stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (modelId.includes("deepseek")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="12" cy="12" r="10" fill="#4D6BFE"/>
        <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="white" strokeWidth="1.5"/>
      </svg>
    );
  }
  return <div className="w-4 h-4 rounded-full bg-primary/20" />;
};

export const getDefaultModel = (mode: ModelMode): ModelOption => MODELS[mode]?.[0] || CHAT_MODELS[0];
export const getModelsForMode = (mode: ModelMode): ModelOption[] => MODELS[mode] || CHAT_MODELS;

interface ModelSelectorProps {
  mode: ModelMode;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  showCategories?: boolean;
  centerDropdown?: boolean;
  colorClass?: string;
}

const ModelSelector = ({ mode, selectedModel, onModelChange, colorClass }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Chat mode: simple dropdown
  if (mode === "chat" || mode === "code" || mode === "files") {
    const models = MODELS[mode];
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${colorClass || "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        >
          <ModelBrandIcon modelId={selectedModel.id} />
          {selectedModel.name}
          <ChevronDown className="w-3 h-3" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 z-50 w-56 rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
            >
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    selectedModel.id === m.id
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-accent/50"
                  }`}
                >
                  <ModelBrandIcon modelId={m.id} />
                  <span className="font-medium">{m.name}</span>
                  {selectedModel.id === m.id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Images/Videos: full picker sheet
  const pickerMode = mode === "images" ? "images" : mode === "videos" ? "videos" : "chat";

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${colorClass || "bg-primary text-primary-foreground hover:bg-primary/90"}`}
      >
        {selectedModel.name}
        <ChevronDown className="w-3 h-3" />
      </button>

      <ModelPickerSheet
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onModelChange}
        mode={pickerMode}
        selectedModelId={selectedModel.id}
      />
    </>
  );
};

export default ModelSelector;
