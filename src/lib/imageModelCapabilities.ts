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

const IMAGE_MODEL_CAPABILITIES: Record<string, ImageModelCapability> = {
  "megsy-v1-img": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "gpt-image": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "nano-banana-2": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "flux-kontext": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "ideogram-3": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "seedream-5-lite": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "recraft-v4": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "flux-2-pro": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "seedream-4": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "grok-imagine": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "imagineart-1.5": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "fal-hidream-i1": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "fal-aura-v2": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "fal-stable-cascade": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "fal-omnigen2": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "fal-flux-realism": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "logo-creator": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "sticker-maker": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },
  "qr-art": {
    acceptsImages: false,
    requiresImage: false,
    maxImages: 0,
    acceptedMimeTypes: [],
    helperText: TEXT_TO_IMAGE_HELPER,
  },

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
