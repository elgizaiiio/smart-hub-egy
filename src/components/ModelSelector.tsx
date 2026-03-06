import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type Mode = "chat" | "code" | "files" | "images" | "videos";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

const MODELS: Record<Mode, ModelOption[]> = {
  chat: [
    { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
    { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
    { id: "grok-3", name: "Grok 3", provider: "xAI" },
    { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek" },
    { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta" },
    { id: "command-r-plus", name: "Command R+", provider: "Cohere" },
    { id: "mistral-large", name: "Mistral Large", provider: "Mistral" },
  ],
  code: [
    { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic" },
    { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
    { id: "deepseek-coder-v3", name: "DeepSeek Coder V3", provider: "DeepSeek" },
    { id: "grok-3", name: "Grok 3", provider: "xAI" },
  ],
  files: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
    { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
    { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic" },
  ],
  images: [
    { id: "flux-1.1-pro-ultra", name: "FLUX 1.1 Pro Ultra", provider: "BFL" },
    { id: "dall-e-4", name: "DALL-E 4", provider: "OpenAI" },
    { id: "stable-diffusion-4", name: "SD 4", provider: "Stability" },
    { id: "midjourney-v7", name: "Midjourney v7", provider: "Midjourney" },
    { id: "ideogram-v3", name: "Ideogram v3", provider: "Ideogram" },
    { id: "recraft-v3", name: "Recraft v3", provider: "Recraft" },
    { id: "imagen-3", name: "Imagen 3", provider: "Google" },
    { id: "leonardo-phoenix-2", name: "Leonardo Phoenix 2", provider: "Leonardo" },
  ],
  videos: [
    { id: "kling-v2.5", name: "Kling v2.5", provider: "Kuaishou" },
    { id: "sora-v2", name: "Sora v2", provider: "OpenAI" },
    { id: "veo-2", name: "Veo 2", provider: "Google" },
    { id: "runway-gen4", name: "Gen-4", provider: "Runway" },
    { id: "luma-ray-2", name: "Ray 2", provider: "Luma" },
    { id: "minimax-video-02", name: "Video-02", provider: "MiniMax" },
    { id: "pika-v2.5", name: "Pika v2.5", provider: "Pika" },
    { id: "wan-video-2", name: "Wan Video 2", provider: "Alibaba" },
  ],
};

interface ModelSelectorProps {
  mode: Mode;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
}

export const getDefaultModel = (mode: Mode): ModelOption => MODELS[mode][0];
export const getModelsForMode = (mode: Mode): ModelOption[] => MODELS[mode];

const ModelSelector = ({ mode, selectedModel, onModelChange }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-secondary/80"
      >
        <span className="text-foreground font-medium">{selectedModel.name}</span>
        <span className="hidden sm:inline text-muted-foreground">{selectedModel.provider}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full mb-2 left-0 w-64 glass-panel p-1 z-50 max-h-72 overflow-y-auto"
            >
              {MODELS[mode].map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onModelChange(model); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedModel.id === model.id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <span>{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.provider}</span>
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
