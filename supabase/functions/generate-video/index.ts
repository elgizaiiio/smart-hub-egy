import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VIDEO_MODEL_MAP: Record<string, { endpoint: string }> = {
  // Text-to-Video
  "megsy-video": { endpoint: "fal-ai/minimax/hailuo-2.3/pro/text-to-video" },
  "veo-3.1": { endpoint: "fal-ai/veo3.1" },
  "veo-3.1-fast": { endpoint: "fal-ai/veo3.1/fast" },
  "kling-3-pro": { endpoint: "fal-ai/kling-video/v3/pro/text-to-video" },
  "kling-o1": { endpoint: "fal-ai/kling-video/o1/standard/text-to-video" },
  "openai-sora": { endpoint: "fal-ai/sora-2/text-to-video" },
  "pika-2.2": { endpoint: "fal-ai/pika/v2.2/text-to-video" },
  "luma-dream": { endpoint: "fal-ai/luma-dream-machine/ray-2" },
  "seedance-pro": { endpoint: "fal-ai/bytedance/seedance/v1.5/pro/text-to-video" },
  "pixverse-5.5": { endpoint: "fal-ai/pixverse/v5.5/text-to-video" },
  "wan-2.6": { endpoint: "fal-ai/wan/v2.6/text-to-video" },
  // Image-to-Video
  "megsy-video-i2v": { endpoint: "fal-ai/minimax/hailuo-2.3/pro/image-to-video" },
  "kling-3-pro-i2v": { endpoint: "fal-ai/kling-video/v3/pro/image-to-video" },
  "kling-o1-i2v": { endpoint: "fal-ai/kling-video/o1/standard/image-to-video" },
  "veo-3.1-fast-i2v": { endpoint: "fal-ai/veo3.1/fast/image-to-video" },
  "openai-sora-i2v": { endpoint: "fal-ai/sora-2/image-to-video" },
  "pixverse-5.5-i2v": { endpoint: "fal-ai/pixverse/v5.5/image-to-video" },
  "wan-2.6-i2v": { endpoint: "fal-ai/wan/v2.6/image-to-video" },
  "wan-flf": { endpoint: "fal-ai/wan-flf2v" },
  // Avatar
  "kling-avatar-pro": { endpoint: "fal-ai/kling-video/ai-avatar/v2/pro" },
  "kling-avatar-std": { endpoint: "fal-ai/kling-video/ai-avatar/v2/standard" },
  "sadtalker": { endpoint: "fal-ai/sadtalker" },
  "sync-lipsync": { endpoint: "fal-ai/sync-lipsync/v2" },
  // Premium effects
  "luma-modify": { endpoint: "fal-ai/luma-dream-machine/ray-2/modify" },
  "pika-magic": { endpoint: "fal-ai/pika/v1.5/pikaffects" },
  "pixverse-effects": { endpoint: "fal-ai/pixverse/v5.5/effects" },
  // Motion
  "dreamactor-v2": { endpoint: "fal-ai/bytedance/dreamactor/v2" },
  "perf-capture": { endpoint: "fal-ai/live-portrait" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url, user_id, credits_cost } = await req.json();
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    // Deduct credits if user_id provided
    if (user_id && credits_cost) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, serviceRoleKey);
      const { data: creditResult } = await sb.rpc("deduct_credits", {
        p_user_id: user_id,
        p_amount: Number(credits_cost),
        p_action_type: "video_generation",
        p_description: `${model || "default"} - ${(prompt || "").slice(0, 50)}`,
      });
      if (creditResult && !creditResult.success) {
        return new Response(JSON.stringify({ error: creditResult.error || "Insufficient credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const modelConfig = VIDEO_MODEL_MAP[model] || VIDEO_MODEL_MAP["megsy-video"];
    const endpoint = modelConfig.endpoint;

    const input: Record<string, any> = { prompt: prompt || "A cinematic video" };
    if (image_url) input.image_url = image_url;

    console.log(`Generating video with model: ${model}, endpoint: ${endpoint}`);

    // Submit to queue
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
      console.error("fal video submit error:", submitResp.status, errText);
      throw new Error(`fal.ai error: ${submitResp.status}`);
    }

    const { request_id } = await submitResp.json();

    // Poll for result
    let result = null;
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 3000));
      
      const statusResp = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}/status`, {
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });
      
      if (!statusResp.ok) {
        console.error("fal status error:", statusResp.status, await statusResp.text());
        continue;
      }

      const status = await statusResp.json();
      
      if (status.status === "COMPLETED") {
        const resultResp = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}`, {
          headers: { Authorization: `Key ${FAL_API_KEY}` },
        });
        result = await resultResp.json();
        break;
      }
      if (status.status === "FAILED") {
        throw new Error("Video generation failed");
      }
    }

    if (!result) throw new Error("Generation timed out");

    let videoUrl = "";
    if (result.video?.url) videoUrl = result.video.url;
    else if (result.output?.url) videoUrl = result.output.url;

    return new Response(JSON.stringify({ video_url: videoUrl, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
