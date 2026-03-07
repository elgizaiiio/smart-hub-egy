// Centralized model details — descriptions, capabilities, modes, and requirements
// Built from edge function MODEL_MAPs + imageModelCapabilities + videoModelCapabilities

export type ModelType = "chat" | "image" | "image-tool" | "video" | "video-i2v" | "video-avatar" | "video-effect" | "video-motion";

export interface ModelDetail {
  id: string;
  name: string;
  type: ModelType;
  credits: number;
  description: string;
  longDescription: string;
  icon: string; // lucide icon name
  modes: string[];
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  inputLabels?: string[]; // e.g. ["Start Frame", "End Frame (optional)"]
  resolutions?: string[];
  notes?: string;
  provider: string; // always "Megsy" for display, internal reference
  speed?: "fast" | "standard" | "slow";
  quality?: "standard" | "high" | "ultra";
}

const MIME_IMG = ["image/jpeg", "image/png", "image/webp"];

export const ALL_MODEL_DETAILS: ModelDetail[] = [
  // ═══════════════════════════════════════════
  // CHAT MODELS
  // ═══════════════════════════════════════════
  {
    id: "google/gemini-3-flash-preview", name: "Megsy V1", type: "chat", credits: 0,
    description: "Fast, versatile AI assistant for everyday tasks.",
    longDescription: "Megsy V1 is a high-speed general-purpose AI model optimized for conversational interactions, reasoning, coding, and creative writing. It offers excellent performance with minimal latency.",
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
  // IMAGE GENERATION MODELS (text-to-image)
  // ═══════════════════════════════════════════
  {
    id: "megsy-v1-img", name: "Megsy v1", type: "image", credits: 4,
    description: "Megsy's flagship image generation model.",
    longDescription: "Our default image model powered by advanced diffusion architecture. Produces high-quality images across all styles — photorealistic, artistic, anime, and more.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "gpt-image", name: "GPT Image 1.5", type: "image", credits: 5,
    description: "OpenAI's image generation with precise prompt following.",
    longDescription: "GPT Image 1.5 excels at accurately interpreting detailed text prompts, producing images with precise composition, text rendering, and photorealistic output.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "nano-banana-2", name: "Nano Banana 2", type: "image", credits: 4,
    description: "Fast, high-quality general-purpose image generation.",
    longDescription: "Nano Banana 2 delivers excellent image quality with fast generation times. Great for all creative styles from photorealism to illustration.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "flux-kontext", name: "FLUX Kontext Max", type: "image", credits: 3,
    description: "Advanced text-to-image with excellent text rendering.",
    longDescription: "FLUX Kontext Max produces stunning images with exceptional text rendering in images, perfect for posters, signs, and branded content.",
    icon: "Type", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "ideogram-3", name: "Ideogram 3", type: "image", credits: 3,
    description: "Best-in-class text rendering in generated images.",
    longDescription: "Ideogram 3 specializes in generating images with accurate, readable text. Ideal for logos, posters, social media graphics, and any image requiring embedded text.",
    icon: "Type", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "seedream-5-lite", name: "Seedream 5 Lite", type: "image", credits: 2,
    description: "Lightweight yet powerful image generation.",
    longDescription: "ByteDance Seedream 5 Lite offers impressive quality at a lower cost, with fast generation and good prompt adherence.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "recraft-v4", name: "Recraft V4", type: "image", credits: 3,
    description: "Professional design-focused image generation.",
    longDescription: "Recraft V4 Pro produces clean, design-ready images ideal for professional use — marketing materials, product mockups, and brand assets.",
    icon: "Palette", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "flux-2-pro", name: "FLUX 2 Pro", type: "image", credits: 5,
    description: "Premium quality with maximum detail and coherence.",
    longDescription: "FLUX 2 Pro delivers the highest quality output with exceptional detail, coherence, and prompt following. Best for professional and commercial use.",
    icon: "Crown", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "seedream-4", name: "Seedream 4.5", type: "image", credits: 2,
    description: "Balanced quality and speed for everyday use.",
    longDescription: "ByteDance Seedream 4.5 provides reliable image generation with good quality and fast turnaround, suitable for quick creative iterations.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "grok-imagine", name: "Grok Imagine", type: "image", credits: 3,
    description: "Creative image generation with artistic flair.",
    longDescription: "Grok Imagine from xAI produces creative and sometimes unexpected artistic interpretations of prompts, great for unique creative exploration.",
    icon: "Sparkles", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "imagineart-1.5", name: "ImagineArt 1.5", type: "image", credits: 2,
    description: "Artistic-style image creation.",
    longDescription: "ImagineArt 1.5 Pro specializes in generating artistic and stylized images, from digital art to traditional painting styles.",
    icon: "Palette", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "standard",
  },
  {
    id: "fal-hidream-i1", name: "HiDream I1 Full", type: "image", credits: 2,
    description: "High-resolution dreamlike image generation.",
    longDescription: "HiDream I1 Full creates vivid, dreamlike images with rich colors and surreal artistic quality. Excellent for fantasy and concept art.",
    icon: "CloudMoon", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "fal-aura-v2", name: "Aura Flow v2", type: "image", credits: 1,
    description: "Budget-friendly open-source image generation.",
    longDescription: "Aura Flow v2 provides decent image quality at the lowest credit cost. Great for quick prototyping and casual use.",
    icon: "Image", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "fal-stable-cascade", name: "Stable Cascade", type: "image", credits: 1,
    description: "Efficient cascading diffusion architecture.",
    longDescription: "Stable Cascade uses a multi-stage generation process for efficient, high-quality images. Budget-friendly with good general quality.",
    icon: "Layers", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "fal-omnigen2", name: "OmniGen2", type: "image", credits: 2,
    description: "Versatile multi-purpose image generation.",
    longDescription: "OmniGen2 is a unified model capable of generating images from text. It handles diverse styles and subjects with good consistency.",
    icon: "Wand2", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "fal-flux-realism", name: "FLUX Realism", type: "image", credits: 2,
    description: "Photorealistic image specialist.",
    longDescription: "FLUX Realism is fine-tuned for generating photorealistic images that look like real photographs. Ideal for product shots and realistic scenes.",
    icon: "Camera", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "logo-creator", name: "Logo Creator", type: "image", credits: 2,
    description: "Professional logo and brand mark generation.",
    longDescription: "Generates clean, professional logos optimized for brand identity. Outputs simple, scalable designs suitable for business use.",
    icon: "Hexagon", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "sticker-maker", name: "Sticker Maker", type: "image", credits: 2,
    description: "Fun sticker and emoji generation.",
    longDescription: "Creates cute, colorful stickers and emoji-style images perfect for messaging, social media, and digital products.",
    icon: "Smile", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "qr-art", name: "QR Art", type: "image", credits: 2,
    description: "Artistic QR code generation.",
    longDescription: "Creates beautiful, scannable QR codes embedded in artistic imagery. Perfect for marketing materials and creative business cards.",
    icon: "QrCode", modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "standard",
    notes: "Include the target URL in your prompt for QR functionality.",
  },

  // ═══════════════════════════════════════════
  // IMAGE TOOLS (require image input)
  // ═══════════════════════════════════════════
  {
    id: "nano-banana-edit", name: "Nano Banana Edit", type: "image-tool", credits: 2,
    description: "Edit images with text instructions. Supports up to 4 images.",
    longDescription: "A powerful image editing model that understands natural language instructions. Upload up to 4 reference images and describe what you want to change.",
    icon: "Pencil", modes: ["image-editing"], acceptsImages: true, requiresImage: true, maxImages: 4, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image 1", "Image 2 (optional)", "Image 3 (optional)", "Image 4 (optional)"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "object-remover", name: "Object Remover", type: "image-tool", credits: 2,
    description: "Remove unwanted objects from images.",
    longDescription: "Intelligently removes selected objects from images while preserving the background seamlessly. Describe what to remove in your prompt.",
    icon: "Eraser", modes: ["object-removal"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image to edit"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "watermark-remover", name: "Watermark Remover", type: "image-tool", credits: 2,
    description: "Remove watermarks and overlaid text.",
    longDescription: "Detects and removes watermarks, logos, and overlaid text from images while reconstructing the underlying image content.",
    icon: "Droplets", modes: ["watermark-removal"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Watermarked image"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "image-extender", name: "Image Extender", type: "image-tool", credits: 2,
    description: "Extend image canvas with AI outpainting.",
    longDescription: "Extends the boundaries of an image by generating new content that seamlessly continues beyond the original edges. Great for creating wider or taller compositions.",
    icon: "Maximize2", modes: ["outpainting"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image to extend"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "flux-pro-editor", name: "FLUX Pro Editor", type: "image-tool", credits: 2,
    description: "Professional precision image editing.",
    longDescription: "FLUX 2 Pro's editing mode allows fine-grained control over image modifications using text instructions. Produces high-quality edits with excellent coherence.",
    icon: "PenTool", modes: ["image-editing"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image to edit"],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "image-variations", name: "Image Variations", type: "image-tool", credits: 2,
    description: "Generate variations of existing images. Up to 4 references.",
    longDescription: "Creates new image variations inspired by your reference images. Upload up to 4 images to guide the style, composition, and mood of the output.",
    icon: "Copy", modes: ["image-variation"], acceptsImages: true, requiresImage: true, maxImages: 4, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Reference 1", "Reference 2 (optional)", "Reference 3 (optional)", "Reference 4 (optional)"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "photo-colorizer", name: "Photo Colorizer", type: "image-tool", credits: 1,
    description: "Colorize black & white photos.",
    longDescription: "Transforms grayscale or black-and-white photos into full-color images using AI to predict historically accurate or artistically vibrant colors.",
    icon: "Palette", modes: ["colorization"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["B&W photo"],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "bg-remover", name: "Background Remover", type: "image-tool", credits: 1,
    description: "Remove image backgrounds instantly.",
    longDescription: "Precisely removes backgrounds from images, leaving clean transparent cutouts. Perfect for product photos, portraits, and design assets.",
    icon: "Scissors", modes: ["background-removal"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "4k-upscaler", name: "4K Upscaler", type: "image-tool", credits: 2,
    description: "Upscale images to 4K with enhanced detail.",
    longDescription: "Upscales low-resolution images to 4K quality by adding realistic detail and sharpness. Ideal for enlarging small images without losing quality.",
    icon: "ArrowUpRight", modes: ["upscaling"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Low-res image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "face-enhancer", name: "Face Enhancer", type: "image-tool", credits: 1,
    description: "Restore and enhance faces in photos.",
    longDescription: "Specialized AI that focuses on restoring and enhancing facial features in photos — sharpens details, fixes artifacts, and improves overall face quality.",
    icon: "User", modes: ["face-restoration"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Photo with faces"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "creative-upscaler", name: "Creative Upscaler", type: "image-tool", credits: 2,
    description: "Upscale with creative AI-generated detail.",
    longDescription: "Unlike standard upscalers, the Creative Upscaler adds new AI-generated details while enlarging, resulting in richer, more detailed outputs.",
    icon: "Sparkles", modes: ["creative-upscaling"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image to upscale"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "old-photo-restorer", name: "Old Photo Restorer", type: "image-tool", credits: 2,
    description: "Restore damaged and old photos.",
    longDescription: "Repairs scratches, tears, fading, and other damage in old or deteriorated photographs. Brings vintage photos back to life with AI restoration.",
    icon: "History", modes: ["photo-restoration"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Damaged photo"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "bg-replacer", name: "Background Replacer", type: "image-tool", credits: 2,
    description: "Replace backgrounds with AI. Supports 2 images.",
    longDescription: "Removes the original background and replaces it with a new one. Upload the subject image and optionally a reference background image, or describe the desired background.",
    icon: "Replace", modes: ["background-replacement"], acceptsImages: true, requiresImage: true, maxImages: 2, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Subject image", "Background reference (optional)"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "style-transfer", name: "Style Transfer", type: "image-tool", credits: 2,
    description: "Apply artistic styles from reference images.",
    longDescription: "Transfers the artistic style from one image to another. Upload the content image and a style reference to create a fusion of both.",
    icon: "Brush", modes: ["style-transfer"], acceptsImages: true, requiresImage: true, maxImages: 2, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Content image", "Style reference (optional)"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "ai-relighting", name: "AI Relighting", type: "image-tool", credits: 3,
    description: "Change lighting conditions in photos.",
    longDescription: "Re-lights subjects and scenes by modifying light direction, intensity, color temperature, and ambient lighting. Describe the desired lighting in your prompt.",
    icon: "Sun", modes: ["relighting"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Image to relight"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "photo-to-cartoon", name: "Photo to Cartoon", type: "image-tool", credits: 3,
    description: "Convert photos to cartoon style.",
    longDescription: "Transforms real photographs into cartoon-style illustrations while preserving the original composition and subject likeness.",
    icon: "Brush", modes: ["cartoonification"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Photo to cartoonify"],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "product-photo", name: "Product Photo", type: "image-tool", credits: 2,
    description: "Studio-quality product photography.",
    longDescription: "Places your product in a professional studio setting with optimal lighting and composition. Perfect for e-commerce and marketing materials.",
    icon: "ShoppingBag", modes: ["product-photography"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Product image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "ai-headshot", name: "AI Headshot", type: "image-tool", credits: 2,
    description: "Professional headshot generation.",
    longDescription: "Transforms casual photos into professional headshots suitable for LinkedIn, business cards, and corporate profiles.",
    icon: "UserCircle", modes: ["headshot-generation"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Face photo"],
    provider: "Megsy", speed: "standard", quality: "high",
  },

  // ═══════════════════════════════════════════
  // VIDEO GENERATION (text-to-video)
  // ═══════════════════════════════════════════
  {
    id: "megsy-video", name: "Megsy Video", type: "video", credits: 6,
    description: "Megsy's default video generation model.",
    longDescription: "Our flagship video model powered by advanced generative architecture. Creates smooth, high-quality videos from text prompts with cinematic quality.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "veo-3.1", name: "Google Veo 3.1", type: "video", credits: 30,
    description: "Google's premium video generation with audio.",
    longDescription: "Google Veo 3.1 generates high-fidelity cinematic videos with synchronized audio. The most capable video model available — produces Hollywood-quality output.",
    icon: "Film", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "slow", quality: "ultra",
  },
  {
    id: "veo-3.1-fast", name: "Veo 3.1 Fast", type: "video", credits: 12,
    description: "Faster Veo generation at reduced cost.",
    longDescription: "A faster variant of Google Veo 3.1 that trades some quality for significantly faster generation times and lower credit cost.",
    icon: "Film", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "kling-3-pro", name: "Kling 3.0 Pro", type: "video", credits: 20,
    description: "Professional cinematic video generation.",
    longDescription: "Kling 3.0 Pro creates stunning cinematic videos with excellent motion coherence, detailed environments, and professional camera movements.",
    icon: "Clapperboard", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "kling-o1", name: "Kling O1", type: "video", credits: 15,
    description: "Balanced quality video generation.",
    longDescription: "Kling O1 offers a great balance between video quality and generation speed. Suitable for most video creation needs.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "openai-sora", name: "OpenAI Sora", type: "video", credits: 8,
    description: "OpenAI's realistic video generation.",
    longDescription: "Sora creates highly realistic videos with complex scenes, camera movements, and character interactions. Excels at understanding physical world dynamics.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "pika-2.2", name: "Pika 2.2", type: "video", credits: 8,
    description: "Creative and stylized video generation.",
    longDescription: "Pika 2.2 excels at generating creative, stylized videos with unique visual effects and artistic flair. Great for social media content.",
    icon: "Sparkles", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "luma-dream", name: "Luma Dream Machine", type: "video", credits: 8,
    description: "Dreamlike video generation with smooth motion.",
    longDescription: "Luma Dream Machine (Ray 2) generates videos with smooth, natural motion and dreamlike visual quality. Excellent at capturing atmosphere and mood.",
    icon: "CloudMoon", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "seedance-pro", name: "Seedance Pro", type: "video", credits: 5,
    description: "ByteDance's professional video model.",
    longDescription: "Seedance Pro from ByteDance creates high-quality videos with good motion coherence and scene understanding at a competitive credit cost.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "wan-2.6", name: "WAN 2.6", type: "video", credits: 10,
    description: "Versatile open-source video generation.",
    longDescription: "WAN 2.6 is a versatile video model capable of generating diverse content with good quality. Supports various aspect ratios and durations.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "pixverse-5.5", name: "PixVerse v5.5", type: "video", credits: 8,
    description: "High-quality video with creative effects.",
    longDescription: "PixVerse v5.5 generates high-quality videos with support for creative visual effects and stylistic variations.",
    icon: "Video", modes: ["text-to-video"], acceptsImages: false, requiresImage: false, maxImages: 0, acceptedMimeTypes: [],
    provider: "Megsy", speed: "standard", quality: "high",
  },

  // ═══════════════════════════════════════════
  // VIDEO I2V (image-to-video)
  // ═══════════════════════════════════════════
  {
    id: "megsy-video-i2v", name: "Megsy Video I2V", type: "video-i2v", credits: 6,
    description: "Animate images into video. Requires 1 image.",
    longDescription: "Megsy's image-to-video model brings still images to life with natural motion and cinematic quality. Upload one image as a starting frame.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "kling-3-pro-i2v", name: "Kling 3.0 Pro I2V", type: "video-i2v", credits: 20,
    description: "Premium image-to-video conversion. Requires 1 image.",
    longDescription: "Kling 3.0 Pro's image-to-video mode creates cinematic video from a single starting image with professional-grade motion and quality.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "kling-o1-i2v", name: "Kling O1 I2V", type: "video-i2v", credits: 15,
    description: "Balanced image-to-video generation. Requires 1 image.",
    longDescription: "Kling O1's image-to-video mode animates still images with good motion quality and reasonable generation times.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "veo-3.1-fast-i2v", name: "Veo 3.1 Fast I2V", type: "video-i2v", credits: 12,
    description: "Fast Google Veo image-to-video. Requires 1 image.",
    longDescription: "Google Veo 3.1 Fast's image-to-video mode quickly transforms a starting image into a high-quality video clip.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "openai-sora-i2v", name: "OpenAI Sora I2V", type: "video-i2v", credits: 8,
    description: "Sora image-to-video generation. Requires 1 image.",
    longDescription: "OpenAI Sora's image-to-video mode creates realistic video from a single starting image with natural physics and motion.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "pixverse-5.5-i2v", name: "PixVerse v5.5 I2V", type: "video-i2v", credits: 8,
    description: "PixVerse image-to-video. Requires 1 image.",
    longDescription: "PixVerse v5.5's image-to-video mode creates dynamic video from a starting frame with creative visual effects.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "wan-2.6-i2v", name: "WAN 2.6 I2V", type: "video-i2v", credits: 10,
    description: "WAN image-to-video conversion. Requires 1 image.",
    longDescription: "WAN 2.6's image-to-video mode transforms a starting image into a video with diverse motion and scene continuation.",
    icon: "PlayCircle", modes: ["image-to-video"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Starting frame image"],
    provider: "Megsy", speed: "standard", quality: "high",
  },
  {
    id: "wan-flf", name: "WAN First-Last-Frame", type: "video-i2v", credits: 6,
    description: "Video from start & end frames. Requires 1–2 images.",
    longDescription: "WAN First-Last-Frame generates a video that transitions smoothly from a starting image to an optional ending image. Upload 1 image (start frame) or 2 images (start + end frame) to define the video's journey.",
    icon: "ArrowRightLeft", modes: ["first-last-frame"], acceptsImages: true, requiresImage: true, maxImages: 2, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Start frame", "End frame (optional)"],
    notes: "Unique model: define both where the video starts AND ends. The AI creates a smooth transition between frames.",
    provider: "Megsy", speed: "standard", quality: "high",
  },

  // ═══════════════════════════════════════════
  // VIDEO AVATAR
  // ═══════════════════════════════════════════
  {
    id: "kling-avatar-pro", name: "Kling Avatar V2 Pro", type: "video-avatar", credits: 10,
    description: "Premium AI avatar animation. Requires 1 face image.",
    longDescription: "Creates high-quality animated avatars from a single face image. The avatar speaks and moves naturally based on your text prompt. Professional quality for presentations and content.",
    icon: "UserCircle", modes: ["avatar-animation"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Face portrait image"],
    provider: "Megsy", speed: "standard", quality: "ultra",
  },
  {
    id: "kling-avatar-std", name: "Kling Avatar V2 Std", type: "video-avatar", credits: 5,
    description: "Standard AI avatar animation. Requires 1 face image.",
    longDescription: "Creates animated avatars from a face image at standard quality. Good for casual use, social media, and quick avatar videos.",
    icon: "UserCircle", modes: ["avatar-animation"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Face portrait image"],
    provider: "Megsy", speed: "fast", quality: "high",
  },
  {
    id: "sadtalker", name: "SadTalker", type: "video-avatar", credits: 2,
    description: "Talking head animation. Requires 1 face image.",
    longDescription: "SadTalker animates a single face photo into a talking head video. The face moves naturally with head poses and lip sync based on your prompt.",
    icon: "MessageCircle", modes: ["talking-head"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Face photo"],
    provider: "Megsy", speed: "fast", quality: "standard",
  },
  {
    id: "sync-lipsync", name: "Sync Lipsync V2", type: "video-avatar", credits: 50,
    description: "Professional lip-sync video. Requires 1 face image/video.",
    longDescription: "Sync Lipsync V2 provides the most accurate lip synchronization for face images or existing videos. Premium quality suitable for professional dubbing and content creation.",
    icon: "Mic", modes: ["lip-sync"], acceptsImages: true, requiresImage: true, maxImages: 1, acceptedMimeTypes: MIME_IMG,
    inputLabels: ["Face image or video frame"],
    notes: "Premium model — highest quality lip-sync available.",
    provider: "Megsy", speed: "slow", quality: "ultra",
  },
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
