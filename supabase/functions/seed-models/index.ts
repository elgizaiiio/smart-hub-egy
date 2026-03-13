import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Clear old model configs
  await sb.from("memories").delete().eq("key", "models_added");
  await sb.from("memories").delete().eq("key", "models_hidden");
  await sb.from("memories").delete().like("key", "model_config_%");

  const MIME_IMG = ["image/jpeg", "image/png", "image/webp"];

  const models = [
    // ═══ IMAGE MODELS (ordered best → worst, Megsy first) ═══
    {
      id: "megsy-imagine", name: "Megsy Imagine", type: "image", credits: 3,
      description: "النموذج الرئيسي لميغسي - جودة فائقة مع دعم تعديل الصور",
      provider: "Megsy", speed: "standard", quality: "ultra",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 10,
      acceptedMimeTypes: MIME_IMG, badges: ["🔥", "4K", "PRO"],
    },
    {
      id: "nano-banana-pro", name: "Nano Banana Pro", type: "image", credits: 5,
      description: "أعلى جودة صور مع دعم 4K وتعديل متعدد الصور",
      provider: "Fal", speed: "standard", quality: "ultra",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 10,
      acceptedMimeTypes: MIME_IMG, badges: ["4K", "PRO"],
    },
    {
      id: "nano-banana-2", name: "Nano Banana 2", type: "image", credits: 4,
      description: "جودة ممتازة مع دعم 4K وتعديل الصور",
      provider: "Fal", speed: "standard", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG, badges: ["4K", "NEW"],
    },
    {
      id: "gpt-image-1.5", name: "GPT Image 1.5", type: "image", credits: 5,
      description: "نموذج OpenAI للصور - جودة عالية مع دعم التعديل",
      provider: "OpenAI", speed: "standard", quality: "ultra",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 10,
      acceptedMimeTypes: MIME_IMG, badges: ["PRO"],
    },
    {
      id: "gpt-image-1-mini", name: "GPT Image 1 Mini", type: "image", credits: 3,
      description: "نسخة سريعة وأخف من نموذج GPT للصور",
      provider: "OpenAI", speed: "fast", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG, badges: ["FAST"],
    },
    {
      id: "kling-o3", name: "Kling O3", type: "image", credits: 2,
      description: "نموذج Kling المتقدم - دعم 4K وأبعاد متعددة",
      provider: "Kling", speed: "standard", quality: "ultra",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG, badges: ["4K", "NEW"],
    },
    {
      id: "ideogram-3", name: "Ideogram 3", type: "image", credits: 2,
      description: "متميز في النصوص داخل الصور والتصاميم الإبداعية",
      provider: "Ideogram", speed: "standard", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["NEW"],
    },
    {
      id: "flux-2-pro", name: "FLUX 2 Pro", type: "image", credits: 2,
      description: "نموذج FLUX المحترف - تفاصيل دقيقة وألوان غنية",
      provider: "BFL", speed: "standard", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG, badges: ["PRO"],
    },
    {
      id: "imagen-4", name: "Imagen 4", type: "image", credits: 2,
      description: "نموذج Google للصور - جودة فوتوغرافية واقعية",
      provider: "Google", speed: "standard", quality: "high",
      modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0,
      acceptedMimeTypes: [], badges: ["NEW"],
    },
    {
      id: "seedream-5", name: "Seedream 5", type: "image", credits: 1,
      description: "نموذج ByteDance المتطور - جودة عالية بسعر اقتصادي",
      provider: "ByteDance", speed: "standard", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG, badges: ["NEW"],
    },
    {
      id: "seedream-4.5", name: "Seedream 4.5", type: "image", credits: 1,
      description: "جودة ممتازة مع دعم تعديل الصور",
      provider: "ByteDance", speed: "fast", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "kling-3.0", name: "Kling 3.0", type: "image", credits: 1,
      description: "نموذج Kling الاقتصادي للصور عالية الجودة",
      provider: "Kling", speed: "fast", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 1,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "flux-pro-ultra", name: "FLUX Pro Ultra", type: "image", credits: 1,
      description: "نموذج FLUX بدقة فائقة",
      provider: "BFL", speed: "standard", quality: "high",
      modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0,
      acceptedMimeTypes: [],
    },
    {
      id: "nano-banana", name: "Nano Banana", type: "image", credits: 2,
      description: "نموذج سريع ومتعدد الاستخدامات",
      provider: "Fal", speed: "fast", quality: "high",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "wan-2.6-img", name: "Wan 2.6", type: "image", credits: 1,
      description: "نموذج Wan متعدد الوسائط للصور",
      provider: "Wan", speed: "fast", quality: "standard",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 4,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "grok-imagine", name: "Grok Imagine", type: "image", credits: 1,
      description: "نموذج xAI للصور الإبداعية",
      provider: "xAI", speed: "fast", quality: "standard",
      modes: ["text-to-image", "image-to-image"], acceptsImages: true, requiresImage: false, maxImages: 1,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "imagine-art", name: "Imagine Art 1.5 Pro", type: "image", credits: 1,
      description: "نموذج فني متخصص في الأعمال الإبداعية",
      provider: "ImagineArt", speed: "fast", quality: "standard",
      modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0,
      acceptedMimeTypes: [],
    },
    {
      id: "z-image-turbo", name: "Z-Image Turbo", type: "image", credits: 1,
      description: "نموذج سريع جداً لإنشاء الصور",
      provider: "Fal", speed: "fast", quality: "standard",
      modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0,
      acceptedMimeTypes: [], badges: ["FAST"],
    },
    {
      id: "hunyuan-v3", name: "Hunyuan V3", type: "image", credits: 3,
      description: "نموذج Tencent للصور بجودة عالية",
      provider: "Tencent", speed: "standard", quality: "high",
      modes: ["text-to-image"], acceptsImages: false, requiresImage: false, maxImages: 0,
      acceptedMimeTypes: [],
    },

    // ═══ VIDEO MODELS (ordered best → worst, Megsy first) ═══
    {
      id: "megsy-video", name: "Megsy Video", type: "video", credits: 4,
      description: "النموذج الرئيسي لميغسي فيديو - أعلى جودة",
      provider: "Megsy", speed: "standard", quality: "ultra",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["🔥", "PRO"],
    },
    {
      id: "veo-3.1", name: "Veo 3.1", type: "video", credits: 3,
      description: "نموذج Google الأقوى للفيديو - دعم صوت و4K",
      provider: "Google", speed: "slow", quality: "ultra",
      modes: ["text-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["4K", "NEW"],
    },
    {
      id: "veo-3.1-fast", name: "Veo 3.1 Fast", type: "video", credits: 2,
      description: "نسخة سريعة من Veo 3.1 مع دعم 4K",
      provider: "Google", speed: "fast", quality: "high",
      modes: ["text-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["4K", "FAST"],
    },
    {
      id: "kling-3-pro", name: "Kling 3.0 Pro", type: "video", credits: 4,
      description: "نموذج Kling المتقدم للفيديوهات الاحترافية",
      provider: "Kling", speed: "standard", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["PRO"],
    },
    {
      id: "kling-o3-pro", name: "Kling O3 Pro", type: "video", credits: 4,
      description: "أحدث نموذج Kling للفيديوهات فائقة الجودة",
      provider: "Kling", speed: "standard", quality: "ultra",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["NEW", "PRO"],
    },
    {
      id: "grok-video", name: "Grok Video", type: "video", credits: 2,
      description: "نموذج xAI لإنشاء وتعديل الفيديو",
      provider: "xAI", speed: "fast", quality: "standard",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 1,
      acceptedMimeTypes: MIME_IMG, badges: ["NEW"],
    },
    {
      id: "sora-2-pro", name: "Sora 2 Pro", type: "video", credits: 4,
      description: "نموذج OpenAI المتقدم لإنشاء الفيديوهات",
      provider: "OpenAI", speed: "standard", quality: "high",
      modes: ["text-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["PRO"],
    },
    {
      id: "sora-2", name: "Sora 2", type: "video", credits: 4,
      description: "نموذج OpenAI الأساسي لإنشاء الفيديوهات",
      provider: "OpenAI", speed: "standard", quality: "high",
      modes: ["text-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "seedance-1.5-pro", name: "Seedance 1.5 Pro", type: "video", credits: 2,
      description: "نموذج ByteDance المتطور للفيديوهات",
      provider: "ByteDance", speed: "standard", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["NEW"],
    },
    {
      id: "seedance-1.0-pro", name: "Seedance 1.0 Pro", type: "video", credits: 4,
      description: "نموذج ByteDance الأساسي للفيديوهات",
      provider: "ByteDance", speed: "standard", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "seedance-1.0-fast", name: "Seedance 1.0 Fast", type: "video", credits: 4,
      description: "نسخة سريعة من Seedance للفيديوهات",
      provider: "ByteDance", speed: "fast", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["FAST"],
    },
    {
      id: "kling-2.6-pro", name: "Kling 2.6 Pro", type: "video", credits: 2,
      description: "نموذج Kling 2.6 للفيديوهات",
      provider: "Kling", speed: "standard", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "kling-1.6-pro", name: "Kling 1.6 Pro", type: "video", credits: 2,
      description: "نموذج Kling 1.6 الاقتصادي",
      provider: "Kling", speed: "fast", quality: "standard",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "kling-2.5-turbo", name: "Kling 2.5 Turbo", type: "video", credits: 2,
      description: "نموذج Kling السريع للفيديوهات",
      provider: "Kling", speed: "fast", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG, badges: ["FAST"],
    },
    {
      id: "kling-2.1", name: "Kling 2.1", type: "video", credits: 2,
      description: "نموذج Kling 2.1 متعدد الأوضاع",
      provider: "Kling", speed: "standard", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "wan-2.6-vid", name: "Wan 2.6 Video", type: "video", credits: 2,
      description: "نموذج Wan للفيديوهات متعدد الوسائط",
      provider: "Wan", speed: "standard", quality: "high",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 2,
      acceptedMimeTypes: MIME_IMG,
    },
    {
      id: "ltx-2", name: "LTX 2.0", type: "video", credits: 2,
      description: "نموذج LTX للفيديوهات السريعة",
      provider: "Fal", speed: "fast", quality: "standard",
      modes: ["text-to-video", "image-to-video"], acceptsImages: true, requiresImage: false, maxImages: 1,
      acceptedMimeTypes: MIME_IMG, badges: ["FAST"],
    },
  ];

  // Insert models_added
  await sb.from("memories").insert({
    key: "models_added",
    value: JSON.stringify(models),
  });

  return new Response(JSON.stringify({ success: true, count: models.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
