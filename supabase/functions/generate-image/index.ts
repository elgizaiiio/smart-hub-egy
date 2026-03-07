import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_MAP: Record<string, { endpoint: string; inputKey?: string }> = {
  "megsy-v1-img": { endpoint: "fal-ai/flux-pro/v1.1" },
  "gpt-image": { endpoint: "fal-ai/flux-pro/v1.1" },
  "nano-banana-2": { endpoint: "fal-ai/flux-pro/v1.1" },
  "flux-kontext": { endpoint: "fal-ai/flux-pro/kontext" },
  "ideogram-3": { endpoint: "fal-ai/ideogram/v3" },
  "seedream-5-lite": { endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image" },
  "grok-imagine": { endpoint: "fal-ai/flux-pro/v1.1" },
  "recraft-v4": { endpoint: "fal-ai/recraft-v3" },
  "flux-2-pro": { endpoint: "fal-ai/flux-pro/v1.1" },
  "seedream-4": { endpoint: "fal-ai/bytedance/seedream/v5/lite/text-to-image" },
  "imagineart-1.5": { endpoint: "fal-ai/flux-pro/v1.1" },
  "fal-hidream-i1": { endpoint: "fal-ai/hidream-i1-full" },
  "fal-aura-v2": { endpoint: "fal-ai/aura-flow" },
  "fal-stable-cascade": { endpoint: "fal-ai/stable-cascade" },
  "fal-omnigen2": { endpoint: "fal-ai/omnigen-v1" },
  "fal-flux-realism": { endpoint: "fal-ai/flux-realism" },
  "logo-creator": { endpoint: "fal-ai/recraft-v3" },
  "sticker-maker": { endpoint: "fal-ai/flux-pro/v1.1" },
  "qr-art": { endpoint: "fal-ai/flux-pro/v1.1" },
  "nano-banana-edit": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "object-remover": { endpoint: "fal-ai/lama" },
  "watermark-remover": { endpoint: "fal-ai/lama" },
  "image-extender": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "flux-pro-editor": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "image-variations": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "photo-colorizer": { endpoint: "fal-ai/colorize-image" },
  "photo-to-sketch": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "bg-remover": { endpoint: "fal-ai/birefnet" },
  "photo-to-cartoon": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "4k-upscaler": { endpoint: "fal-ai/ccsr" },
  "face-enhancer": { endpoint: "fal-ai/ccsr" },
  "product-photo": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "bg-replacer": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "ai-headshot": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "creative-upscaler": { endpoint: "fal-ai/creative-upscaler" },
  "old-photo-restorer": { endpoint: "fal-ai/ccsr" },
  "passport-photo": { endpoint: "fal-ai/birefnet" },
  "style-transfer": { endpoint: "fal-ai/flux-pro/kontext", inputKey: "image_url" },
  "ai-relighting": { endpoint: "fal-ai/ic-light" },
};

async function safeJson(resp: Response): Promise<any> {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response (status ${resp.status}): ${text.slice(0, 200)}`);
  }
}

// Upload base64 data URI to fal storage and return a URL
async function uploadBase64ToFal(base64DataUrl: string, apiKey: string): Promise<string> {
  // If it's already an http(s) URL, return as-is
  if (base64DataUrl.startsWith("http://") || base64DataUrl.startsWith("https://")) {
    return base64DataUrl;
  }

  // Extract mime type and base64 data
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data format");
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Upload to fal.ai storage
  const uploadResp = await fetch("https://fal.run/fal-ai/workflows/upload", {
    method: "PUT",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": mimeType,
    },
    body: binaryData,
  });

  if (!uploadResp.ok) {
    const errText = await uploadResp.text();
    console.error("fal upload error:", uploadResp.status, errText);
    throw new Error(`Failed to upload image to fal.ai: ${uploadResp.status}`);
  }

  const uploadResult = await safeJson(uploadResp);
  return uploadResult.url || uploadResult.file_url || uploadResult.access_url;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await safeJson(req);
    const { prompt, model, image_url } = body;
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    const modelConfig = MODEL_MAP[model] || MODEL_MAP["megsy-v1-img"];
    const endpoint = modelConfig.endpoint;

    const input: Record<string, any> = { prompt: prompt || "A beautiful image" };

    // Handle image_url: convert base64 to hosted URL if needed
    if (image_url) {
      try {
        const hostedUrl = await uploadBase64ToFal(image_url, FAL_API_KEY);
        input.image_url = hostedUrl;
      } catch (e) {
        console.error("Image upload failed, skipping image:", e);
        // Continue without image if upload fails
      }
    }

    const submitResp = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!submitResp.ok) {
      const errText = await submitResp.text();
      console.error("fal submit error:", submitResp.status, errText);
      throw new Error(`fal.ai error: ${submitResp.status} - ${errText.slice(0, 200)}`);
    }

    const submitData = await safeJson(submitResp);
    const request_id = submitData.request_id;
    if (!request_id) throw new Error("No request_id returned from fal.ai");

    let result = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusResp = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}/status`, {
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });

      if (!statusResp.ok) {
        const errText = await statusResp.text();
        console.error("fal status error:", statusResp.status, errText);
        continue;
      }

      const status = await safeJson(statusResp);
      if (status.status === "COMPLETED") {
        const resultResp = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}`, {
          headers: { Authorization: `Key ${FAL_API_KEY}` },
        });
        if (!resultResp.ok) {
          const errText = await resultResp.text();
          throw new Error(`fal result fetch error: ${resultResp.status} - ${errText.slice(0, 200)}`);
        }
        result = await safeJson(resultResp);
        break;
      }
      if (status.status === "FAILED") throw new Error("Image generation failed");
    }

    if (!result) throw new Error("Generation timed out");

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
