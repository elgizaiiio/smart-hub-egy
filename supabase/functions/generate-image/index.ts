import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ModelConfig = {
  endpoint: string;
  editEndpoint?: string;
  inputKey?: string;
  multiInputKey?: string;
  maxImages?: number;
  requiresImage?: boolean;
  supportsNumImages?: boolean;
  supportsImageSize?: boolean;
  provider?: "fal" | "deapi";
  deapiEndpoint?: string;
  deapiModel?: string;
};

const MODEL_MAP: Record<string, ModelConfig> = {
  // ── Megsy Imagine (flagship) ──
  "megsy-imagine": { endpoint: "fal-ai/nano-banana-pro", editEndpoint: "fal-ai/nano-banana-pro/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 10, supportsNumImages: true, supportsImageSize: true },
  // ── Premium Models ──
  "nano-banana-pro": { endpoint: "fal-ai/nano-banana-pro", editEndpoint: "fal-ai/nano-banana-pro/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 10, supportsNumImages: true, supportsImageSize: true },
  "nano-banana-2": { endpoint: "fal-ai/nano-banana-2", editEndpoint: "fal-ai/nano-banana-2/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  "gpt-image-1.5": { endpoint: "fal-ai/gpt-image-1.5", editEndpoint: "fal-ai/gpt-image-1.5/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 10, supportsNumImages: true, supportsImageSize: true },
  "gpt-image-1-mini": { endpoint: "fal-ai/gpt-image-1-mini/edit", editEndpoint: "fal-ai/gpt-image-1-mini/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  // ── High-End ──
  "kling-o3": { endpoint: "fal-ai/kling-image/o3/text-to-image", editEndpoint: "fal-ai/kling-image/o3/image-to-image", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsImageSize: true },
  "ideogram-3": { endpoint: "fal-ai/ideogram/v3", editEndpoint: "fal-ai/ideogram/v3/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 2, supportsNumImages: true, supportsImageSize: true },
  "flux-2-pro": { endpoint: "fal-ai/flux-2-pro", editEndpoint: "fal-ai/flux-2-pro/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  "imagen-4": { endpoint: "fal-ai/imagen4/preview/ultra", supportsNumImages: true, supportsImageSize: true },
  // ── Standard ──
  "seedream-5": { endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image", editEndpoint: "fal-ai/bytedance/seedream/v5/lite/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  "seedream-4.5": { endpoint: "fal-ai/bytedance/seedream/v4.5/text-to-image", editEndpoint: "fal-ai/bytedance/seedream/v4.5/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  "kling-3.0": { endpoint: "fal-ai/kling-image/v3/text-to-image", editEndpoint: "fal-ai/kling-image/v3/image-to-image", inputKey: "image_url", maxImages: 1, supportsImageSize: true },
  "flux-pro-ultra": { endpoint: "fal-ai/flux-pro/v1.1-ultra", supportsNumImages: true, supportsImageSize: true },
  "nano-banana": { endpoint: "fal-ai/nano-banana", editEndpoint: "fal-ai/nano-banana/edit", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  "wan-2.6-img": { endpoint: "wan/v2.6/text-to-image", editEndpoint: "wan/v2.6/image-to-image", inputKey: "image_url", multiInputKey: "image_urls", maxImages: 4, supportsNumImages: true, supportsImageSize: true },
  "grok-imagine": { endpoint: "xai/grok-imagine-image", editEndpoint: "xai/grok-imagine-image/edit", inputKey: "image_url", maxImages: 1, supportsNumImages: true, supportsImageSize: true },
  "imagine-art": { endpoint: "imagineart/imagineart-1.5-preview/text-to-image", supportsImageSize: true },
  "z-image-turbo": { endpoint: "fal-ai/z-image/turbo", supportsNumImages: true, supportsImageSize: true },
  "hunyuan-v3": { endpoint: "fal-ai/hunyuan-image/v3/text-to-image", supportsImageSize: true },
  // ═══════════════════════════════════════════
  // FREE DEAPI MODELS
  // ═══════════════════════════════════════════
  "flux2-klein-4b": { endpoint: "", provider: "deapi", deapiEndpoint: "txt2img", deapiModel: "FLUX.2-Klein-4B-BF16" },
  "z-image-turbo-int8": { endpoint: "", provider: "deapi", deapiEndpoint: "txt2img", deapiModel: "Z-Image-Turbo-INT8" },
  "flux1-schnell": { endpoint: "", provider: "deapi", deapiEndpoint: "txt2img", deapiModel: "FLUX.1-schnell" },
  "qwen-image-edit-plus": { endpoint: "", provider: "deapi", deapiEndpoint: "img2img", deapiModel: "Qwen-Image-Edit-Plus", requiresImage: true, maxImages: 1, inputKey: "image" },
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

// ── deAPI key rotation ──
async function getDeapiKey(sb: ReturnType<typeof createClient>): Promise<{ key: string; id: string } | null> {
  const { data } = await sb
    .from("deapi_keys")
    .select("id, api_key")
    .eq("is_active", true)
    .order("usage_count", { ascending: true })
    .limit(5);
  if (!data || data.length === 0) return null;
  const pick = data[Math.floor(Math.random() * data.length)];
  // Increment usage
  await sb.from("deapi_keys").update({ usage_count: (pick as any).usage_count + 1 || 1, last_used_at: new Date().toISOString() }).eq("id", pick.id);
  return { key: pick.api_key, id: pick.id };
}

async function markKeyInactive(sb: ReturnType<typeof createClient>, keyId: string) {
  await sb.from("deapi_keys").update({ is_active: false }).eq("id", keyId);
}

async function callDeapi(
  sb: ReturnType<typeof createClient>,
  deapiEndpoint: string,
  body: Record<string, unknown>,
  maxRetries = 3,
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyData = await getDeapiKey(sb);
    if (!keyData) throw new Error("No active deAPI keys available");

    try {
      const resp = await fetch(`https://api.deapi.ai/api/v1/client/${deapiEndpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keyData.key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (resp.status === 401 || resp.status === 403) {
        console.warn(`deAPI key ${keyData.id} failed (${resp.status}), marking inactive and retrying...`);
        await markKeyInactive(sb, keyData.id);
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`deAPI error: ${resp.status} - ${errText.slice(0, 200)}`);
      }

      const result = await resp.json();
      
      // If async, poll for result
      if (result.request_id) {
        return await pollDeapiResult(keyData.key, result.request_id);
      }
      
      return result;
    } catch (e: any) {
      if (e.message?.includes("deAPI key") || attempt === maxRetries - 1) throw e;
    }
  }
  throw new Error("All deAPI key attempts failed");
}

async function pollDeapiResult(apiKey: string, requestId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const resp = await fetch(`https://api.deapi.ai/api/v1/client/request-status/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!resp.ok) continue;
    const status = await resp.json();
    if (status.status === "completed" || status.status === "success") return status;
    if (status.status === "failed" || status.status === "error") throw new Error("deAPI generation failed");
  }
  throw new Error("deAPI generation timed out");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url, image_urls, user_id, credits_cost, num_images, image_size } = await req.json();
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Deduct credits
    if (user_id && credits_cost) {
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

    const modelConfig = MODEL_MAP[model] || MODEL_MAP["megsy-imagine"];

    // ═══ DEAPI MODELS ═══
    if (modelConfig.provider === "deapi") {
      const deapiBody: Record<string, unknown> = {
        prompt: prompt || "A beautiful image",
        model: modelConfig.deapiModel,
      };
      if (image_size) {
        deapiBody.width = image_size.width || 1024;
        deapiBody.height = image_size.height || 1024;
      }
      // For img2img, add image
      if (modelConfig.deapiEndpoint === "img2img" && (image_url || (image_urls && image_urls[0]))) {
        deapiBody.image = image_url || image_urls[0];
      }

      console.log(`Generating image via deAPI: model=${modelConfig.deapiModel}, endpoint=${modelConfig.deapiEndpoint}`);
      const result = await callDeapi(sb, modelConfig.deapiEndpoint!, deapiBody);
      
      // Extract URL from deAPI response
      let imageUrl = "";
      if (result.image_url) imageUrl = result.image_url;
      else if (result.output?.image_url) imageUrl = result.output.image_url;
      else if (result.result?.image_url) imageUrl = result.result.image_url;
      else if (result.images?.[0]?.url) imageUrl = result.images[0].url;
      else if (typeof result.output === "string") imageUrl = result.output;

      return new Response(JSON.stringify({ image_urls: imageUrl ? [imageUrl] : [], image_url: imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ FAL.AI MODELS ═══
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    const requestedCount = Math.min(Math.max(num_images || 1, 1), 4);

    const rawImages = [
      ...(Array.isArray(image_urls) ? image_urls : []),
      ...(image_url ? [image_url] : []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    const uniqueImages = [...new Set(rawImages)].slice(0, modelConfig.maxImages || 1);
    const processedImages = uniqueImages.map((img) => normalizeImageInput(img));

    const hasImages = processedImages.length > 0;
    const endpoint = hasImages && modelConfig.editEndpoint ? modelConfig.editEndpoint : modelConfig.endpoint;

    const input: Record<string, unknown> = { prompt: prompt || "A beautiful image" };

    if (modelConfig.supportsImageSize && image_size) {
      input.image_size = { width: image_size.width || 1024, height: image_size.height || 1024 };
    }
    if (modelConfig.supportsNumImages && requestedCount > 1) {
      input.num_images = requestedCount;
    }
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
