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
  supportsNumImages?: boolean;
  supportsImageSize?: boolean;
};

const MODEL_MAP: Record<string, ModelConfig> = {
  // ── Text-to-Image ──
  "megsy-v1-img": { endpoint: "fal-ai/nano-banana-pro", supportsNumImages: true, supportsImageSize: true },
  "gpt-image": { endpoint: "fal-ai/gpt-image-1.5", supportsImageSize: true },
  "gpt-image-1": { endpoint: "fal-ai/gpt-image-1", supportsImageSize: true },
  "nano-banana-2": { endpoint: "fal-ai/nano-banana-pro", supportsNumImages: true, supportsImageSize: true },
  "nano-banana-pro": { endpoint: "fal-ai/nano-banana-pro", supportsNumImages: true, supportsImageSize: true },
  "flux-kontext": { endpoint: "fal-ai/flux-pro/kontext/max/text-to-image", supportsImageSize: true },
  "flux-kontext-std": { endpoint: "fal-ai/flux-pro/kontext/text-to-image", supportsImageSize: true },
  "ideogram-3": { endpoint: "fal-ai/ideogram/v3", supportsImageSize: true },
  "seedream-5-lite": { endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image", supportsImageSize: true },
  "recraft-v4": { endpoint: "fal-ai/recraft/v4/pro/text-to-image", supportsImageSize: true },
  "flux-2-pro": { endpoint: "fal-ai/flux-2-pro", supportsNumImages: true, supportsImageSize: true },
  "seedream-4": { endpoint: "fal-ai/bytedance/seedream/v4.5/text-to-image", supportsImageSize: true },
  "seedream-4-0": { endpoint: "fal-ai/bytedance/seedream/v4/text-to-image", supportsImageSize: true },
  "imagineart-1.5": { endpoint: "imagineart/imagineart-1.5-pro-preview/text-to-image", supportsImageSize: true },
  "grok-imagine": { endpoint: "fal-ai/grok-imagine", supportsImageSize: true },
  "fal-hidream-i1": { endpoint: "fal-ai/hidream-i1-full", supportsImageSize: true },
  "fal-aura-v2": { endpoint: "fal-ai/aura-flow", supportsImageSize: true },
  "fal-stable-cascade": { endpoint: "fal-ai/stable-cascade", supportsImageSize: true },
  "fal-omnigen2": { endpoint: "fal-ai/omnigen-v1", supportsImageSize: true },
  "fal-flux-realism": { endpoint: "fal-ai/flux-realism", supportsNumImages: true, supportsImageSize: true },
  // New models
  "lucid-origin": { endpoint: "fal-ai/flux-pro/v1.1", supportsNumImages: true, supportsImageSize: true },
  "lucid-realism": { endpoint: "fal-ai/flux/dev", supportsNumImages: true, supportsImageSize: true },
  "flux-dev": { endpoint: "fal-ai/flux/dev", supportsNumImages: true, supportsImageSize: true },
  "flux-schnell": { endpoint: "fal-ai/flux/schnell", supportsNumImages: true, supportsImageSize: true },
  "phoenix-1": { endpoint: "fal-ai/flux-pro/v1", supportsNumImages: true, supportsImageSize: true },
  "phoenix-0.9": { endpoint: "fal-ai/flux-pro", supportsNumImages: true, supportsImageSize: true },
  // Business
  "logo-creator": { endpoint: "fal-ai/recraft/v3/text-to-image", supportsImageSize: true },
  "sticker-maker": { endpoint: "fal-ai/nano-banana-pro", supportsImageSize: true },
  "qr-art": { endpoint: "fal-ai/nano-banana-pro", supportsImageSize: true },
  "product-photo": { endpoint: "fal-ai/image-apps-v2/product-photography", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "ai-headshot": { endpoint: "fal-ai/image-apps-v2/headshot-photo", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "passport-photo": { endpoint: "fal-ai/birefnet", inputKey: "image_url", maxImages: 1, requiresImage: true },
  // ── Image Editing (require image) ──
  "nano-banana-edit": { endpoint: "fal-ai/nano-banana-pro/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, requiresImage: true },
  "object-remover": { endpoint: "fal-ai/image-editing/object-removal", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "watermark-remover": { endpoint: "fal-ai/image-apps-v2/object-removal", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "image-extender": { endpoint: "fal-ai/image-apps-v2/outpaint", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "flux-pro-editor": { endpoint: "fal-ai/flux-2-pro/edit", inputKey: "image_url", maxImages: 1, requiresImage: true },
  "image-variations": { endpoint: "fal-ai/flux-pro/v1.1/redux", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, requiresImage: true },
  // ── Enhancement (require image) ──
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
    const { prompt, model, image_url, image_urls, user_id, credits_cost, num_images, image_size } = await req.json();
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    // Deduct credits
    if (user_id && credits_cost) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, serviceRoleKey);
      const { data: creditResult } = await sb.rpc("deduct_credits", {
        p_user_id: user_id,
        p_amount: Number(credits_cost),
        p_action_type: "image_generation",
        p_description: `${model || "default"} - ${(prompt || "").slice(0, 50)}`,
      });
      if (creditResult && !creditResult.success) {
        return new Response(JSON.stringify({ error: creditResult.error || "Insufficient credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const modelConfig = MODEL_MAP[model] || MODEL_MAP["megsy-v1-img"];
    const endpoint = modelConfig.endpoint;
    const requestedCount = Math.min(Math.max(num_images || 1, 1), 4);

    const input: Record<string, unknown> = { prompt: prompt || "A beautiful image" };

    // Add image_size if supported
    if (modelConfig.supportsImageSize && image_size) {
      input.image_size = { width: image_size.width || 1024, height: image_size.height || 1024 };
    }

    // Add num_images if supported and > 1
    if (modelConfig.supportsNumImages && requestedCount > 1) {
      input.num_images = requestedCount;
    }

    // Handle image inputs
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

    console.log(`Generating image with model: ${model}, endpoint: ${endpoint}, images: ${processedImages.length}, num_images: ${requestedCount}`);

    // If model doesn't support num_images but user wants multiple, make parallel requests
    const needsParallel = requestedCount > 1 && !modelConfig.supportsNumImages;
    
    if (needsParallel) {
      const promises = Array.from({ length: requestedCount }, () =>
        fetch(`https://fal.run/${endpoint}`, {
          method: "POST",
          headers: { Authorization: `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
      );
      const responses = await Promise.all(promises);
      const allUrls: string[] = [];

      for (const resp of responses) {
        if (!resp.ok) continue;
        const result = await resp.json();
        if (result.images?.[0]?.url) allUrls.push(result.images[0].url);
        else if (result.image?.url) allUrls.push(result.image.url);
        else if (result.output?.url) allUrls.push(result.output.url);
      }

      return new Response(JSON.stringify({ image_urls: allUrls, image_url: allUrls[0] || "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single request
    const resp = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("fal.ai error:", resp.status, errText);
      throw new Error(`fal.ai error: ${resp.status} - ${errText.slice(0, 200)}`);
    }

    const result = await resp.json();

    // Collect all image URLs
    const allUrls: string[] = [];
    if (result.images && Array.isArray(result.images)) {
      for (const img of result.images) {
        if (img?.url) allUrls.push(img.url);
      }
    }
    if (allUrls.length === 0 && result.image?.url) allUrls.push(result.image.url);
    if (allUrls.length === 0 && result.output?.url) allUrls.push(result.output.url);

    return new Response(JSON.stringify({ image_urls: allUrls, image_url: allUrls[0] || "" }), {
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
