import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VideoModelConfig = {
  t2v: string;
  i2v?: string;
};

const VIDEO_MODEL_MAP: Record<string, VideoModelConfig> = {
  // Megsy Video (= Kling O3 Pro)
  "megsy-video": { t2v: "fal-ai/kling-video/o3/pro/text-to-video", i2v: "fal-ai/kling-video/o3/pro/image-to-video" },
  // Premium
  "veo-3.1": { t2v: "fal-ai/veo3.1" },
  "veo-3.1-fast": { t2v: "fal-ai/veo3.1/fast", i2v: "fal-ai/veo3.1/fast/image-to-video" },
  "kling-3-pro": { t2v: "fal-ai/kling-video/v3/pro/text-to-video", i2v: "fal-ai/kling-video/v3/pro/image-to-video" },
  "kling-o3-pro": { t2v: "fal-ai/kling-video/o3/pro/text-to-video", i2v: "fal-ai/kling-video/o3/pro/image-to-video" },
  "grok-video": { t2v: "xai/grok-imagine-video/text-to-video", i2v: "xai/grok-imagine-video/image-to-video" },
  "sora-2-pro": { t2v: "fal-ai/sora-2/text-to-video/pro" },
  "sora-2": { t2v: "fal-ai/sora-2/text-to-video" },
  "seedance-1.5-pro": { t2v: "fal-ai/bytedance/seedance/v1.5/pro/text-to-video", i2v: "fal-ai/bytedance/seedance/v1.5/pro/image-to-video" },
  "seedance-1.0-pro": { t2v: "fal-ai/bytedance/seedance/v1/pro/text-to-video", i2v: "fal-ai/bytedance/seedance/v1/pro/image-to-video" },
  "seedance-1.0-fast": { t2v: "fal-ai/bytedance/seedance/v1/pro/fast/text-to-video", i2v: "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video" },
  "kling-2.6-pro": { t2v: "fal-ai/kling-video/v2.6/pro/text-to-video", i2v: "fal-ai/kling-video/v2.6/pro/image-to-video" },
  "kling-1.6-pro": { t2v: "fal-ai/kling-video/v1.6/pro/text-to-video", i2v: "fal-ai/kling-video/v1.6/pro/image-to-video" },
  "kling-2.5-turbo": { t2v: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video", i2v: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video" },
  "kling-2.1": { t2v: "fal-ai/kling-video/v2.1/master/text-to-video", i2v: "fal-ai/kling-video/v2.1/master/image-to-video" },
  "wan-2.6-vid": { t2v: "wan/v2.6/text-to-video", i2v: "wan/v2.6/image-to-video" },
  "ltx-2": { t2v: "fal-ai/ltx-2/text-to-video", i2v: "fal-ai/ltx-2/image-to-video" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url, user_id, credits_cost } = await req.json();
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
    const hasImage = !!image_url;
    const endpoint = hasImage && modelConfig.i2v ? modelConfig.i2v : modelConfig.t2v;

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
