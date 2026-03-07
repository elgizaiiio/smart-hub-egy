import type { PublishPlatform } from "./imageModelCapabilities";

export interface VideoModelCapability {
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  helperText: string;
}

const DEFAULT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TEXT_TO_VIDEO_HELPER = "Text → Video only (no image input).";

const VIDEO_MODEL_CAPABILITIES: Record<string, VideoModelCapability> = {
  "megsy-video": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "veo-3.1": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "veo-3.1-fast": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "kling-3-pro": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "kling-o1": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "openai-sora": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "pika-2.2": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "luma-dream": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "seedance-pro": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "wan-2.6": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  "pixverse-5.5": { acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [], helperText: TEXT_TO_VIDEO_HELPER },
  // I2V
  "megsy-video-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image to animate into video." },
  "kling-3-pro-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image; converts to cinematic video." },
  "kling-o1-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image for animated video output." },
  "veo-3.1-fast-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image; fast image-to-video." },
  "openai-sora-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image for Sora I2V generation." },
  "pixverse-5.5-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image for PixVerse I2V." },
  "wan-2.6-i2v": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one image for WAN I2V." },
  "wan-flf": { acceptsImages: true, requiresImage: true, maxImages: 2, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires 1–2 images (first + optional last frame)." },
  // Avatar
  "kling-avatar-pro": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one face image for avatar animation." },
  "kling-avatar-std": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one face image for avatar animation." },
  "sadtalker": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one face image for talking-head animation." },
  "sync-lipsync": { acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: DEFAULT_MIME_TYPES, helperText: "Requires one face image/video for lip-sync." },
};

const FALLBACK_CAPABILITY: VideoModelCapability = {
  acceptsImages: false,
  requiresImage: false,
  maxImages: 0,
  acceptedMimeTypes: [],
  helperText: TEXT_TO_VIDEO_HELPER,
};

export const getVideoModelCapability = (modelId: string): VideoModelCapability =>
  VIDEO_MODEL_CAPABILITIES[modelId] || FALLBACK_CAPABILITY;

export { type PublishPlatform };
export { PUBLISH_PLATFORM_TO_APP } from "./imageModelCapabilities";
