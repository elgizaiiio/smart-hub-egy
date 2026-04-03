import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEMONDATA_IMG_URL = "https://api.lemondata.cc/v1/images/generations";
const LEMONDATA_EDIT_URL = "https://api.lemondata.cc/v1/images/edits";

const TOOL_MODELS: Record<string, { t2i: string; i2i?: string }> = {
  'inpaint': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'clothes-changer': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'headshot': { t2i: 'nano-banana-pro' },
  'bg-remover': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'face-swap': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'relight': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'colorizer': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'character-swap': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'storyboard': { t2i: 'nano-banana-pro' },
  'sketch-to-image': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'retouching': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'remover': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'hair-changer': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
  'cartoon': { t2i: 'nano-banana-edit', i2i: 'nano-banana-edit' },
};

const TOOL_PROMPTS: Record<string, (p: any) => string> = {
  'inpaint': (p) => p.prompt || "Edit the masked area",
  'clothes-changer': (p) => p.prompt || "Change the clothes",
  'headshot': (p) => p.prompt || "Professional headshot",
  'bg-remover': () => "Remove the background completely, make it transparent",
  'face-swap': () => "Swap the face from the source image onto the target image, preserving all other details exactly.",
  'relight': (p) => `Relight this image with ${p.color || 'white'} light from the ${p.direction || 'left'}`,
  'colorizer': () => "Colorize this black and white image with natural, realistic colors",
  'character-swap': () => "Replace the character in the target image with the person from the source image, preserving pose, clothing style, and background.",
  'storyboard': (p) => p.prompt || "Create a storyboard",
  'sketch-to-image': () => "Convert this sketch to a detailed, realistic colored image",
  'retouching': () => "Professionally retouch this photo: smooth skin, fix blemishes, enhance lighting",
  'remover': (p) => p.prompt || "Remove the marked object from the image",
  'hair-changer': (p) => p.prompt || "Change the hairstyle",
  'cartoon': (p) => p.prompt || "Cartoonify this photo",
};

// ── Smart Key Cache for LemonData ──
let cachedLemonKey: { id: string; api_key: string } | null = null;
let cachedLemonKeyExpiry = 0;
const LEMON_CACHE_TTL = 5 * 60 * 1000;

async function getLemonKey(sb: ReturnType<typeof createClient>, excludeId?: string): Promise<{ id: string; api_key: string } | null> {
  if (cachedLemonKey && Date.now() < cachedLemonKeyExpiry && cachedLemonKey.id !== excludeId) {
    return cachedLemonKey;
  }
  const { data } = await sb.from("lemondata_keys")
    .select("id, api_key")
    .eq("is_active", true)
    .eq("is_blocked", false)
    .limit(50);
  if (!data || data.length === 0) { cachedLemonKey = null; return null; }
  const pool = excludeId ? data.filter((k: any) => k.id !== excludeId) : data;
  if (pool.length === 0) { cachedLemonKey = null; return null; }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  cachedLemonKey = pick;
  cachedLemonKeyExpiry = Date.now() + LEMON_CACHE_TTL;
  return pick;
}

function blockLemonKey(sb: ReturnType<typeof createClient>, keyId: string, reason: string) {
  if (cachedLemonKey?.id === keyId) { cachedLemonKey = null; }
  sb.from("lemondata_keys").update({
    is_blocked: true, block_reason: reason, last_error_at: new Date().toISOString(),
  }).eq("id", keyId).then(() => {
    sb.from("lemondata_keys").select("error_count").eq("id", keyId).single().then(({ data }) => {
      if (data) sb.from("lemondata_keys").update({ error_count: (data.error_count || 0) + 1 }).eq("id", keyId);
    });
  });
}

function markKeyUsed(sb: ReturnType<typeof createClient>, keyId: string) {
  sb.from("lemondata_keys").select("usage_count").eq("id", keyId).single().then(({ data }) => {
    sb.from("lemondata_keys").update({
      last_used_at: new Date().toISOString(),
      usage_count: ((data?.usage_count) || 0) + 1,
    }).eq("id", keyId);
  });
}

async function callLemonImage(
  sb: ReturnType<typeof createClient>,
  modelName: string,
  prompt: string,
  imageUrl?: string,
  maxRetries = 3,
): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyData = await getLemonKey(sb);
    if (!keyData) throw new Error("No active LemonData keys available");

    try {
      const body: Record<string, any> = {
        model: modelName,
        prompt,
        n: 1,
        size: "1024x1024",
      };

      let url = LEMONDATA_IMG_URL;
      if (imageUrl) {
        body.image_url = imageUrl;
        body.image = imageUrl;
        url = LEMONDATA_EDIT_URL;
      }

      console.log(`LemonData image-tools: model=${modelName}, hasImage=${!!imageUrl}, attempt=${attempt + 1}`);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keyData.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (resp.status === 401 || resp.status === 403) {
        blockLemonKey(sb, keyData.id, `HTTP ${resp.status}`);
        continue;
      }
      if (resp.status === 429) continue;
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("LemonData image-tools error:", resp.status, errText.slice(0, 300));
        throw new Error(`LemonData error: ${resp.status} - ${errText.slice(0, 200)}`);
      }

      markKeyUsed(sb, keyData.id);
      const result = await resp.json();

      // Extract URL from response
      if (result.data?.[0]?.url) return result.data[0].url;
      if (result.data?.[0]?.b64_json) return `data:image/png;base64,${result.data[0].b64_json}`;
      if (result.images?.[0]?.url) return result.images[0].url;
      if (result.image?.url) return result.image.url;
      if (result.output?.url) return result.output.url;
      if (typeof result.url === "string") return result.url;

      console.error("LemonData returned no image:", JSON.stringify(result).slice(0, 500));
      throw new Error("No image returned from LemonData");
    } catch (e: any) {
      if (attempt === maxRetries - 1) throw e;
    }
  }
  throw new Error("All LemonData attempts failed");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { tool, image, mask, target, prompt, color, direction } = await req.json();

    const toolConfig = TOOL_MODELS[tool];
    if (!toolConfig) throw new Error(`Unknown tool: ${tool}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Build prompt
    const getPrompt = TOOL_PROMPTS[tool];
    const finalPrompt = getPrompt ? getPrompt({ prompt, color, direction }) : (prompt || "Edit this image");

    // Determine model and image input
    const hasImage = !!(image || target);
    const modelName = hasImage && toolConfig.i2i ? toolConfig.i2i : toolConfig.t2i;
    const inputImage = image || target || undefined;

    // For tools that need mask info in the prompt
    let enrichedPrompt = finalPrompt;
    if (mask && (tool === 'inpaint' || tool === 'remover')) {
      enrichedPrompt = `${finalPrompt}. Apply changes only to the masked/highlighted area.`;
    }

    const resultUrl = await callLemonImage(sb, modelName, enrichedPrompt, inputImage);

    return new Response(JSON.stringify({ url: resultUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("image-tools error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});