import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_MAP: Record<string, { endpoint: string; inputKey?: string }> = {
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
  "product-photo": { endpoint: "fal-ai/image-apps-v2/product-photography", inputKey: "image_url" },
  "ai-headshot": { endpoint: "fal-ai/image-apps-v2/headshot-photo", inputKey: "image_url" },
  "passport-photo": { endpoint: "fal-ai/birefnet" },
  // Image Editing (require image)
  "nano-banana-edit": { endpoint: "fal-ai/nano-banana-pro/edit", inputKey: "image_url" },
  "object-remover": { endpoint: "fal-ai/image-editing/object-removal", inputKey: "image_url" },
  "watermark-remover": { endpoint: "fal-ai/image-apps-v2/object-removal", inputKey: "image_url" },
  "image-extender": { endpoint: "fal-ai/image-apps-v2/outpaint", inputKey: "image_url" },
  "flux-pro-editor": { endpoint: "fal-ai/flux-2-pro/edit", inputKey: "image_url" },
  "image-variations": { endpoint: "fal-ai/flux-pro/v1.1/redux", inputKey: "image_url" },
  // Enhancement (require image)
  "photo-colorizer": { endpoint: "fal-ai/flux/dev/image-to-image", inputKey: "image_url" },
  "bg-remover": { endpoint: "fal-ai/birefnet", inputKey: "image_url" },
  "bg-replacer": { endpoint: "fal-ai/birefnet", inputKey: "image_url" },
  "4k-upscaler": { endpoint: "fal-ai/clarity-upscaler", inputKey: "image_url" },
  "face-enhancer": { endpoint: "fal-ai/codeformer", inputKey: "image_url" },
  "creative-upscaler": { endpoint: "fal-ai/bria/upscale/creative", inputKey: "image_url" },
  "old-photo-restorer": { endpoint: "fal-ai/codeformer", inputKey: "image_url" },
  "photo-to-cartoon": { endpoint: "fal-ai/cartoonify", inputKey: "image_url" },
  "style-transfer": { endpoint: "fal-ai/flux/dev/image-to-image", inputKey: "image_url" },
  "ai-relighting": { endpoint: "fal-ai/ic-light", inputKey: "image_url" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url } = await req.json();
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    const modelConfig = MODEL_MAP[model] || MODEL_MAP["megsy-v1-img"];
    const endpoint = modelConfig.endpoint;

    const input: Record<string, any> = { prompt: prompt || "A beautiful image" };

    // Pass image_url directly (fal.ai accepts both URLs and data URIs)
    if (image_url) {
      const key = modelConfig.inputKey || "image_url";
      input[key] = image_url;
    }

    console.log(`Generating image with model: ${model}, endpoint: ${endpoint}`);

    // Use synchronous API to avoid polling issues
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
