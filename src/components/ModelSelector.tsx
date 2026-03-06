import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type Mode = "chat" | "code" | "files" | "images" | "videos";

export interface ModelOption {
  id: string;
  name: string;
  credits: string;
}

const MODELS: Record<Mode, ModelOption[]> = {
  chat: [
    { id: "google/gemini-3-flash-preview", name: "Megsy-V1", credits: "Free" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", credits: "Free" },
    { id: "openai/gpt-5", name: "GPT-5", credits: "Free" },
    { id: "x-ai/grok-3", name: "Grok 3", credits: "Free" },
    { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", credits: "Free" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", credits: "Free" },
  ],
  code: [
    { id: "x-ai/grok-3", name: "Grok 3", credits: "2" },
    { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", credits: "2" },
    { id: "openai/gpt-5", name: "GPT-5", credits: "2" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", credits: "1" },
  ],
  files: [
    { id: "google/gemini-3-flash-preview", name: "Megsy-V1", credits: "3" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", credits: "3" },
    { id: "openai/gpt-5", name: "GPT-5", credits: "3" },
  ],
  images: [
    { id: "google/gemini-3-pro-image-preview", name: "Megsy-R1", credits: "5" },
    { id: "google/gemini-2.5-flash-image", name: "Nano Banana", credits: "3" },
  ],
  videos: [
    { id: "google/veo-3", name: "Megsy-R1 Video", credits: "25" },
  ],
};

export const getDefaultModel = (mode: Mode): ModelOption => MODELS[mode][0];
export const getModelsForMode = (mode: Mode): ModelOption[] => MODELS[mode];

interface ModelSelectorProps {
  mode: Mode;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
}

const ModelSelector = ({ mode, selectedModel, onModelChange }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const models = MODELS[mode];

  if (models.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <span className="text-foreground font-medium">{selectedModel.name}</span>
        <span className="text-[10px] opacity-60">
          {selectedModel.credits === "Free" ? "Free" : `${selectedModel.credits} cr`}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full mb-1 left-0 z-40 glass-panel p-1 min-w-[200px]"
            >
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    m.id === selectedModel.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <span>{m.name}</span>
                  <span className="text-[10px] opacity-60">
                    {m.credits === "Free" ? "Free" : `${m.credits} credits`}
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
