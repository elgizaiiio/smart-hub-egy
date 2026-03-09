// Centralized model details — descriptions, capabilities, modes, and requirements
// Image/Video models are now fully dynamic via admin bot. Only chat models are hardcoded.

export type ModelType = "chat" | "image" | "image-tool" | "video" | "video-i2v" | "video-avatar" | "video-effect" | "video-motion";

export interface ModelDetail {
  id: string;
  name: string;
  type: ModelType;
  credits: number;
  description: string;
  longDescription: string;
  icon: string;
  modes: string[];
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  inputLabels?: string[];
  resolutions?: string[];
  notes?: string;
  provider: string;
  speed?: "fast" | "standard" | "slow";
  quality?: "standard" | "high" | "ultra";
  customization?: Record<string, any>;
  iconUrl?: string;
  badges?: string[];
}

const MIME_IMG = ["image/jpeg", "image/png", "image/webp"];

export const ALL_MODEL_DETAILS: ModelDetail[] = [
  // ═══════════════════════════════════════════
  // CHAT MODELS (hardcoded)
  // ═══════════════════════════════════════════
  {
    id: "google/gemini-3-flash-preview", name: "Megsy V1", type: "chat", credits: 0,
    description: "Fast, versatile AI assistant for everyday tasks.",
    longDescription: "Megsy V1 is a high-speed general-purpose AI model optimized for conversational interactions, reasoning, coding, and creative writing.",
    icon: "MessageSquare", modes: ["text-to-text", "multimodal"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", type: "chat", credits: 0,
    description: "Advanced reasoning with extended context window.",
    longDescription: "Google's most capable model with 1M token context, excelling at complex reasoning, code generation, and multi-step problem solving.",
    icon: "Brain", modes: ["text-to-text", "multimodal"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "openai/gpt-5", name: "GPT-5", type: "chat", credits: 0,
    description: "OpenAI's most powerful language model.",
    longDescription: "GPT-5 delivers state-of-the-art performance across all language tasks including creative writing, analysis, coding, and complex reasoning chains.",
    icon: "Sparkles", modes: ["text-to-text", "multimodal"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "x-ai/grok-3", name: "Grok 3", type: "chat", credits: 0,
    description: "Real-time knowledge with witty personality.",
    longDescription: "Grok 3 from xAI excels at real-time information access, coding, and conversational AI with a distinctive personality and up-to-date knowledge.",
    icon: "Zap", modes: ["text-to-text"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "deepseek/deepseek-r1", name: "DeepSeek R1", type: "chat", credits: 0,
    description: "Deep reasoning and chain-of-thought specialist.",
    longDescription: "DeepSeek R1 uses advanced chain-of-thought reasoning to solve complex mathematical, logical, and scientific problems with step-by-step transparency.",
    icon: "Search", modes: ["text-to-text"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "slow", quality: "ultra",
  },
  // ═══════════════════════════════════════════
  // IMAGE & VIDEO MODELS — Added dynamically via admin bot
  // Use "➕ إضافة نموذج جديد" in the Telegram bot to add models
  // ═══════════════════════════════════════════
];

// Helper getters
export const getModelDetail = (id: string): ModelDetail | undefined =>
  ALL_MODEL_DETAILS.find(m => m.id === id);

export const getModelsByType = (type: ModelType): ModelDetail[] =>
  ALL_MODEL_DETAILS.filter(m => m.type === type);

export const getChatModels = () => getModelsByType("chat");
export const getImageGenerationModels = () => getModelsByType("image");
export const getImageToolModels = () => getModelsByType("image-tool");
export const getVideoGenerationModels = () => getModelsByType("video");
export const getVideoI2VModels = () => getModelsByType("video-i2v");
export const getVideoAvatarModels = () => getModelsByType("video-avatar");
