import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOL_MODELS: Record<string, string> = {
  'inpaint': 'fal-ai/qwen-image-edit/inpaint',
  'clothes-changer': 'fal-ai/nano-banana-pro/edit',
  'headshot': 'fal-ai/image-apps-v2/headshot-photo',
  'bg-remover': 'fal-ai/bria/background/remove',
  'face-swap': 'fal-ai/flux-2/klein/9b/base/edit',
  'relight': 'bria/fibo-edit/relight',
  'colorizer': 'bria/fibo-edit/colorize',
  'character-swap': 'fal-ai/flux-2/klein/9b/base/edit',
  'storyboard': 'fal-ai/flux-2-pro',
  'sketch-to-image': 'bria/fibo-edit/sketch_to_colored_image',
  'retouching': 'fal-ai/retoucher',
  'remover': 'fal-ai/qwen-image-edit-plus-lora-gallery/remove-element',
  'hair-changer': 'fal-ai/image-apps-v2/hair-change',
  'cartoon': 'fal-ai/image-editing/cartoonify',
};

const TOOL_COSTS: Record<string, number> = {
  'inpaint': 1, 'clothes-changer': 4, 'headshot': 1, 'bg-remover': 0.5,
  'face-swap': 0.5, 'relight': 1, 'colorizer': 1, 'character-swap': 0.5,
  'storyboard': 1, 'sketch-to-image': 1, 'retouching': 1, 'remover': 1,
  'hair-changer': 1, 'cartoon': 1,
};

async function getLemonDataKey(): Promise<string> {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await sb
    .from("lemondata_keys")
    .select("api_key")
    .eq("is_active", true)
    .eq("is_blocked", false)
    .order("usage_count", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) throw new Error("No active LemonData API key available");

  // Increment usage
  await sb.from("lemondata_keys").update({ usage_count: (data as any).usage_count + 1, last_used_at: new Date().toISOString() }).eq("api_key", data.api_key);

  return data.api_key;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = await getLemonDataKey();

    const { tool, image, mask, target, prompt, color, direction } = await req.json();
    const model = TOOL_MODELS[tool];
    if (!model) throw new Error(`Unknown tool: ${tool}`);

    // Build request body
    const body: Record<string, any> = {};
    
    if (image) body.image_url = image;
    if (mask) body.mask_url = mask;
    if (target) body.target_url = target;
    if (prompt) body.prompt = prompt;
    if (color) body.light_color = color;
    if (direction) body.light_direction = direction;

    // Face/character swap custom prompts
    if (tool === 'face-swap') {
      body.prompt = "Swap the face from the source image onto the target image, preserving all other details exactly.";
    }
    if (tool === 'character-swap') {
      body.prompt = "Replace the character in the target image with the person from the source image, preserving pose, clothing style, and background.";
    }

    const response = await fetch(`https://api.lemonfox.ai/v1/images/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LemonData error: ${response.status} ${err}`);
    }

    const result = await response.json();
    
    // Handle queue response - poll for result
    if (result.request_id) {
      let pollResult;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollResp = await fetch(`https://api.lemonfox.ai/v1/images/${model}/requests/${result.request_id}/status`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        pollResult = await pollResp.json();
        if (pollResult.status === 'COMPLETED') break;
        if (pollResult.status === 'FAILED') throw new Error('Generation failed');
      }
      
      const resultResp = await fetch(`https://api.lemonfox.ai/v1/images/${model}/requests/${result.request_id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const finalResult = await resultResp.json();
      const url = finalResult?.images?.[0]?.url || finalResult?.image?.url || finalResult?.output?.url;
      
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Direct response
    const url = result?.images?.[0]?.url || result?.image?.url || result?.output?.url;
    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});