import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map internal model IDs to fal.ai model endpoints
const MODEL_MAP: Record<string, { endpoint: string; inputKey?: string }> = {
  "megsy-v1-img": { endpoint: "fal-ai/flux-pro/v1.1" },
  "gpt-image": { endpoint: "fal-ai/flux-pro/v1.1" },
  "nano-banana-2": { endpoint: "google/gemini-2.5-flash-image" },
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

// Gemini image generation models that should use Lovable AI gateway
const GEMINI_MODELS = new Set(["nano-banana-2"]);

async function generateWithFal(prompt: string, model: string, image_url?: string) {
  const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
  if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

  const modelConfig = MODEL_MAP[model] || MODEL_MAP["megsy-v1-img"];
  const endpoint = modelConfig.endpoint;

  const input: Record<string, any> = { prompt: prompt || "A beautiful image" };
  if (image_url) {
    input.image_url = image_url;
  }

  if (endpoint.includes("birefnet") || endpoint.includes("lama") || endpoint.includes("ccsr") || endpoint.includes("colorize") || endpoint.includes("ic-light") || endpoint.includes("creative-upscaler")) {
    if (image_url) {
      input.image_url = image_url;
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
    throw new Error(`fal.ai error: ${submitResp.status}`);
  }

  const { request_id } = await submitResp.json();

  let result = null;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusResp = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}/status`, {
      headers: { Authorization: `Key ${FAL_API_KEY}` },
    });
    const status = await statusResp.json();
    if (status.status === "COMPLETED") {
      const resultResp = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}`, {
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });
      result = await resultResp.json();
      break;
    }
    if (status.status === "FAILED") {
      throw new Error("Image generation failed");
    }
  }

  if (!result) throw new Error("Generation timed out");

  let imageUrl = "";
  if (result.images?.[0]?.url) imageUrl = result.images[0].url;
  else if (result.image?.url) imageUrl = result.image.url;
  else if (result.output?.url) imageUrl = result.output.url;

  return imageUrl;
}

async function generateWithLovableAI(prompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        { role: "user", content: `Generate an image: ${prompt}` },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Lovable AI error:", response.status, errText);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract image from response - Gemini image model returns inline image data
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in Lovable AI response");

  // Check for inline_data (base64 image)
  const parts = data.choices?.[0]?.message?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inline_data?.data) {
        return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
      }
    }
  }

  // If content is a URL
  if (typeof content === "string" && (content.startsWith("http") || content.startsWith("data:"))) {
    return content;
  }

  throw new Error("Could not extract image from Lovable AI response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url } = await req.json();
    
    let imageUrl = "";

    // Try fal.ai first, fallback to Lovable AI on 402/403 errors
    try {
      imageUrl = await generateWithFal(prompt, model, image_url);
    } catch (falError: any) {
      const errMsg = falError?.message || "";
      console.warn("fal.ai failed:", errMsg, "- falling back to Lovable AI");
      
      // Fallback to Lovable AI for text-to-image generation (no image_url tools)
      if (!image_url && (errMsg.includes("403") || errMsg.includes("402") || errMsg.includes("429"))) {
        try {
          imageUrl = await generateWithLovableAI(prompt || "A beautiful image");
        } catch (lovableError) {
          console.error("Lovable AI fallback also failed:", lovableError);
          throw falError; // throw original error
        }
      } else {
        throw falError;
      }
    }

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
