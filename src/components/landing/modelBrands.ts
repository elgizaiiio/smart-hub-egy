export interface LandingModelBrand {
  id: string;
  name: string;
  flagship?: boolean;
}

export const LANDING_MODEL_BRANDS: LandingModelBrand[] = [
  { id: "megsy-v1", name: "Megsy V1", flagship: true },
  { id: "megsy-video", name: "Megsy Video", flagship: true },
  { id: "megsy-v1-img", name: "Megsy V1 Image", flagship: true },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "openai/gpt-5", name: "GPT-5" },
  { id: "x-ai/grok-3", name: "Grok 3" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
  { id: "gpt-image", name: "GPT Image 1.5" },
  { id: "nano-banana-2", name: "Nano Banana 2" },
  { id: "flux-kontext", name: "FLUX Kontext Max" },
  { id: "ideogram-3", name: "Ideogram 3" },
  { id: "seedream-5-lite", name: "Seedream 5 Lite" },
  { id: "recraft-v4", name: "Recraft V4" },
  { id: "flux-2-pro", name: "FLUX 2 Pro" },
  { id: "fal-omnigen2", name: "OmniGen2" },
  { id: "openai-sora", name: "Sora" },
  { id: "veo-3.1", name: "Veo 3.1" },
  { id: "kling-3-pro", name: "Kling 3.0 Pro" },
  { id: "pika-2.2", name: "Pika 2.2" },
  { id: "luma-dream", name: "Luma Dream Machine" },
  { id: "seedance-pro", name: "Seedance Pro" },
  { id: "pixverse-5.5", name: "PixVerse V5.5" },
  { id: "grok-imagine", name: "Grok Imagine" },
  { id: "imagineart-1.5", name: "ImagineArt 1.5" },
  { id: "fal-hidream-i1", name: "HiDream I1 Full" },
];
