export interface VideoTool {
  id: string;
  name: string;
  description: string;
  model: string;
  costType: 'flat' | 'per-second' | 'per-minute' | 'dynamic';
  baseCost: number;
  inputType: 'video' | 'video-image' | 'image' | 'video-audio' | 'image-audio-text';
  previewVideo?: string;
  route: string;
  badge?: 'NEW' | 'PRO';
  pricingDetails?: string;
}

export const VIDEO_TOOLS: VideoTool[] = [
  {
    id: 'swap-characters',
    name: 'Swap Characters',
    description: 'Swap faces in any video',
    model: 'fal-ai/pixverse/swap',
    costType: 'dynamic',
    baseCost: 4,
    inputType: 'video-image',
    previewVideo: 'https://i.top4top.io/m_3736q2d581.mp4',
    route: '/videos/tools/swap-characters',
    badge: 'NEW',
    pricingDetails: '720p: 4 MC, 1080p: 5.5 MC (×2 if >5s)',
  },
  {
    id: 'upscale',
    name: 'Video Upscale',
    description: 'Upscale video resolution',
    model: 'fal-ai/bytedance-upscaler/upscale/video',
    costType: 'per-second',
    baseCost: 1,
    inputType: 'video',
    previewVideo: 'https://g.top4top.io/m_3736jvh701.mp4',
    route: '/videos/tools/upscale',
    badge: 'PRO',
    pricingDetails: 'Standard: 1 MC/sec | Pro: 1-3 MC/sec by resolution',
  },
  {
    id: 'talking-photo',
    name: 'Talking Photo',
    description: 'Animate photos with speech',
    model: 'fal-ai/heygen/avatar4/image-to-video',
    costType: 'per-second',
    baseCost: 1.5,
    inputType: 'image-audio-text',
    previewVideo: 'https://d.top4top.io/m_373603i1h1.mp4',
    route: '/videos/tools/talking-photo',
    badge: 'NEW',
  },
  {
    id: 'video-extender',
    name: 'Video Extender',
    description: 'Extend video duration with AI',
    model: 'fal-ai/veo3.1/extend-video',
    costType: 'per-second',
    baseCost: 3,
    inputType: 'video',
    previewVideo: 'https://l.top4top.io/m_3736vpf581.mp4',
    route: '/videos/tools/video-extender',
    badge: 'PRO',
    pricingDetails: 'No audio: 3 MC/sec | With audio: 5 MC/sec',
  },
  {
    id: 'auto-caption',
    name: 'Auto Caption',
    description: 'Add captions to videos automatically',
    model: 'fal-ai/auto-caption',
    costType: 'flat',
    baseCost: 2,
    inputType: 'video',
    previewVideo: 'https://i.top4top.io/m_3736uqhii1.mp4',
    route: '/videos/tools/auto-caption',
  },
  {
    id: 'lip-sync',
    name: 'Lip Sync',
    description: 'Sync video lips to audio',
    model: 'veed/lipsync',
    costType: 'per-minute',
    baseCost: 6,
    inputType: 'video-audio',
    previewVideo: 'https://d.top4top.io/m_373603i1h1.mp4',
    route: '/videos/tools/lip-sync',
    badge: 'PRO',
  },
  {
    id: 'video-stabilizer',
    name: 'Video Stabilizer',
    description: 'Stabilize shaky video footage',
    model: 'fal-ai/video-stabilizer',
    costType: 'per-second',
    baseCost: 1,
    inputType: 'video',
    route: '/videos/tools/video-stabilizer',
    badge: 'NEW',
    pricingDetails: '1 MC/sec',
  },
  {
    id: 'video-translate',
    name: 'Video Translation',
    description: 'Translate video audio to another language',
    model: 'fal-ai/video-translate',
    costType: 'per-minute',
    baseCost: 5,
    inputType: 'video',
    route: '/videos/tools/video-translate',
    badge: 'NEW',
    pricingDetails: '5 MC/min',
  },
  {
    id: 'music-separator',
    name: 'Music Separator',
    description: 'Separate music from vocals in video',
    model: 'fal-ai/music-separator',
    costType: 'flat',
    baseCost: 3,
    inputType: 'video',
    route: '/videos/tools/music-separator',
    badge: 'NEW',
  },
];
