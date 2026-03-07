import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ModelConfig = {
  endpoint: string;
  inputKey?: string;
  multiInputKey?: string;
  maxImages?: number;
  requiresImage?: boolean;
};

const MODEL_MAP: Record<string, ModelConfig> = {
  // Text-to-Image
  "megsy-v1-img": { endpoint: "fal-ai/nano-banana-pro" },
  "gpt-image": { endpoint: "fal-ai/gpt-image-1.5" },
  "nano-banana-2": { endpoint: "fal-ai/nano-banana-pro" },
  "flux-kontext": { endpoint: "fal-ai/flux-pro/kontext/max/text-to-image" },
  "ideogram-3": { endpoint: "fal-ai/ideogram/v3" },
  "seedream-5-lite": { endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image" },
  "recraft-v4": { endpoint: "fal-ai/recraft/v4/pro/text-to-image" },
  "flux-2-pro": { endpoint: "fal-ai/flux-2-pro" },
  "seedream-4": { endpoint: "fal-ai/bytedance/seedream/v4.5/text-to-image" },
  "imagineart-1.5": { endpoint: "imagineart/imagineart-1.5-pro-preview/text-to-image" },
  "grok-imagine": { endpoint: "fal-ai/grok-imagine" },
  "fal-hidream-i1": { endpoint: "fal-ai/hidream-i1-full" },
  "fal-aura-v2": { endpoint: "fal-ai/aura-flow" },
  "fal-stable-cascade": { endpoint: "fal-ai/stable-cascade" },
  "fal-omnigen2": { endpoint: "fal-ai/omnigen-v1" },
  "fal-flux-realism": { endpoint: "fal-ai/flux-realism" },
  // Business
  "logo-creator": { endpoint: "fal-ai/recraft/v3/text-to-image" },
  "sticker-maker": { endpoint: "fal-ai/nano-banana-pro" },
  "qr-art": { endpoint: "fal-ai/nano-banana-pro" },
  "product-photo": { endpoint: "fal-ai/image-apps-v2/product-photography", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "ai-headshot": { endpoint: "fal-ai/image-apps-v2/headshot-photo", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "passport-photo": { endpoint: "fal-ai/birefnet", inputKey: "image_url", maxImages: 1, requiresImage: true },
  // Image Editing (require image)
  "nano-banana-edit": { endpoint: "fal-ai/nano-banana-pro/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, requiresImage: true },
  "object-remover": { endpoint: "fal-ai/image-editing/object-removal", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "watermark-remover": { endpoint: "fal-ai/image-apps-v2/object-removal", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "image-extender": { endpoint: "fal-ai/image-apps-v2/outpaint", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "flux-pro-editor": { endpoint: "fal-ai/flux-2-pro/edit", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "image-variations": { endpoint: "fal-ai/flux-pro/v1.1/redux", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, requiresImage: true },
  // Enhancement (require image)
  "photo-colorizer": { endpoint: "fal-ai/flux/dev/image-to-image", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "bg-remover": { endpoint: "fal-ai/birefnet", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "bg-replacer": { endpoint: "fal-ai/birefnet", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 2, requiresImage: true },
  "4k-upscaler": { endpoint: "fal-ai/clarity-upscaler", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "face-enhancer": { endpoint: "fal-ai/codeformer", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "creative-upscaler": { endpoint: "fal-ai/bria/upscale/creative", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "old-photo-restorer": { endpoint: "fal-ai/codeformer", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "photo-to-cartoon": { endpoint: "fal-ai/cartoonify", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "style-transfer": { endpoint: "fal-ai/flux/dev/image-to-image", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 2, requiresImage: true },
  "ai-relighting": { endpoint: "fal-ai/ic-light", inputKey: "image_url", maxImages: 1, requiresImage: true },
};

const DATA_URI_REGEX = /^data:([^;]+);base64,(.+)$/;

function cleanBase64(base64String: string): string {
  const cleaned = base64String.trim().replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error("Invalid base64 image payload");
  }
  return cleaned;
}

function normalizeImageInput(imageValue: string): string {
  if (!imageValue || !imageValue.startsWith("data:")) return imageValue;

  const match = imageValue.match(DATA_URI_REGEX);
  if (!match) return imageValue;

  const mimeType = match[1] || "image/png";
  const cleanedBase64 = cleanBase64(match[2] || "");
  return `data:${mimeType};base64,${cleanedBase64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url, image_urls } = await req.json();
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    const modelConfig = MODEL_MAP[model] || MODEL_MAP["megsy-v1-img"];
    const endpoint = modelConfig.endpoint;

    const input: Record<string, unknown> = { prompt: prompt || "A beautiful image" };

    const rawImages = [
      ...(Array.isArray(image_urls) ? image_urls : []),
      ...(image_url ? [image_url] : []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    const uniqueImages = [...new Set(rawImages)].slice(0, modelConfig.maxImages || 1);
    const processedImages = uniqueImages.map((img) => normalizeImageInput(img));

    if (modelConfig.requiresImage && processedImages.length === 0) {
      throw new Error(`${model || "Selected model"} requires at least one image input`);
    }

    if (processedImages.length > 0) {
      const singleKey = modelConfig.inputKey || "image_url";
      input[singleKey] = processedImages[0];

      if (modelConfig.multiInputKey && processedImages.length > 1) {
        input[modelConfig.multiInputKey] = processedImages;
      }
    }

    console.log(`Generating image with model: ${model}, endpoint: ${endpoint}, images: ${processedImages.length}`);

    const resp = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("fal.ai error:", resp.status, errText);
      throw new Error(`fal.ai error: ${resp.status} - ${errText.slice(0, 200)}`);
    }

    const result = await resp.json();

    let imageUrl = "";
    if (result.images?.[0]?.url) imageUrl = result.images[0].url;
    else if (result.image?.url) imageUrl = result.image.url;
    else if (result.output?.url) imageUrl = result.output.url;

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
