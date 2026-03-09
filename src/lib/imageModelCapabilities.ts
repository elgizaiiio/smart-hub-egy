export type PublishPlatform = "facebook" | "instagram" | "linkedin";

export interface ImageModelCapability {
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  helperText: string;
}

const DEFAULT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TEXT_TO_IMAGE_HELPER = "Text → Image only (no image input).";

const TEXT_ONLY: ImageModelCapability = {
  acceptsImages: false,
  requiresImage: false,
  maxImages: 0,
  acceptedMimeTypes: [],
  helperText: TEXT_TO_IMAGE_HELPER,
};

const IMAGE_MODEL_CAPABILITIES: Record<string, ImageModelCapability> = {
  "megsy-v1-img": TEXT_ONLY,
  "gpt-image": TEXT_ONLY,
  "gpt-image-1": TEXT_ONLY,
  "nano-banana-2": TEXT_ONLY,
  "nano-banana-pro": TEXT_ONLY,
  "flux-kontext": TEXT_ONLY,
  "flux-kontext-std": TEXT_ONLY,
  "ideogram-3": TEXT_ONLY,
  "seedream-5-lite": TEXT_ONLY,
  "recraft-v4": TEXT_ONLY,
  "flux-2-pro": TEXT_ONLY,
  "seedream-4": TEXT_ONLY,
  "seedream-4-0": TEXT_ONLY,
  "grok-imagine": TEXT_ONLY,
  "imagineart-1.5": TEXT_ONLY,
  "fal-hidream-i1": TEXT_ONLY,
  "fal-aura-v2": TEXT_ONLY,
  "fal-stable-cascade": TEXT_ONLY,
  "fal-omnigen2": TEXT_ONLY,
  "fal-flux-realism": TEXT_ONLY,
  "lucid-origin": TEXT_ONLY,
  "lucid-realism": TEXT_ONLY,
  "flux-dev": TEXT_ONLY,
  "flux-schnell": TEXT_ONLY,
  "phoenix-1": TEXT_ONLY,
  "phoenix-0.9": TEXT_ONLY,
  "logo-creator": TEXT_ONLY,
  "sticker-maker": TEXT_ONLY,
  "qr-art": TEXT_ONLY,

  "nano-banana-edit": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 4,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Image edit model with support for up to 4 input images.",
  },
  "object-remover": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; removes selected objects.",
  },
  "watermark-remover": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; removes watermark artifacts.",
  },
  "image-extender": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; extends canvas/outpaints.",
  },
  "flux-pro-editor": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image for precision editing.",
  },
  "image-variations": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 4,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Variation model that supports up to 4 reference images.",
  },
  "photo-colorizer": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; colorizes and re-renders.",
  },
  "bg-remover": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; removes background.",
  },
  "4k-upscaler": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; upscales to higher detail.",
  },
  "face-enhancer": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; focuses on face restoration.",
  },
  "creative-upscaler": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; adds creative upscale detail.",
  },
  "old-photo-restorer": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; restores old or damaged photos.",
  },
  "bg-replacer": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 2,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires an image and supports up to 2 references for background replacement.",
  },
  "style-transfer": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 2,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires image input; supports up to 2 references for style guidance.",
  },
  "ai-relighting": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; relights subject and scene.",
  },
  "photo-to-cartoon": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image; converts photo style to cartoon.",
  },
  "product-photo": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one product image for studio-style rendering.",
  },
  "ai-headshot": {
    acceptsImages: true,
    requiresImage: true,
    maxImages: 1,
    acceptedMimeTypes: DEFAULT_MIME_TYPES,
    helperText: "Requires one image for professional headshot generation.",
  },
};

const FALLBACK_CAPABILITY: ImageModelCapability = {
  acceptsImages: false,
  requiresImage: false,
  maxImages: 0,
  acceptedMimeTypes: [],
  helperText: TEXT_TO_IMAGE_HELPER,
};

export const getImageModelCapability = (modelId: string): ImageModelCapability =>
  IMAGE_MODEL_CAPABILITIES[modelId] || FALLBACK_CAPABILITY;

export const PUBLISH_PLATFORM_TO_APP: Record<PublishPlatform, string> = {
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
};
