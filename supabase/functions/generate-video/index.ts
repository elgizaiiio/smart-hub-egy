import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VIDEO_MODEL_MAP: Record<string, { endpoint: string }> = {
  "megsy-video": { endpoint: "fal-ai/minimax/video-01" },
  "veo-3.1": { endpoint: "fal-ai/veo2" },
  "veo-3.1-fast": { endpoint: "fal-ai/veo2" },
  "kling-3-pro": { endpoint: "fal-ai/kling-video/v2/master" },
  "openai-sora": { endpoint: "fal-ai/minimax/video-01" },
  "pika-2.2": { endpoint: "fal-ai/minimax/video-01" },
  "luma-dream": { endpoint: "fal-ai/luma-dream-machine" },
  "seedance-pro": { endpoint: "fal-ai/minimax/video-01" },
  "kling-o1": { endpoint: "fal-ai/kling-video/v2/master" },
  "pixverse-5.5": { endpoint: "fal-ai/minimax/video-01" },
  "wan-2.6": { endpoint: "fal-ai/wan/v2.1" },
  // I2V models
  "megsy-video-i2v": { endpoint: "fal-ai/minimax/video-01/image-to-video" },
  "kling-3-pro-i2v": { endpoint: "fal-ai/kling-video/v2/master/image-to-video" },
  "veo-3.1-fast-i2v": { endpoint: "fal-ai/veo2" },
  "openai-sora-i2v": { endpoint: "fal-ai/minimax/video-01/image-to-video" },
  "kling-o1-i2v": { endpoint: "fal-ai/kling-video/v2/master/image-to-video" },
  "pixverse-5.5-i2v": { endpoint: "fal-ai/minimax/video-01/image-to-video" },
  "wan-2.6-i2v": { endpoint: "fal-ai/wan/v2.1/image-to-video" },
  "wan-flf": { endpoint: "fal-ai/wan/v2.1/first-last-frame" },
  // Avatar/lip sync
  "kling-avatar-pro": { endpoint: "fal-ai/kling-video/v2/master/image-to-video" },
  "kling-avatar-std": { endpoint: "fal-ai/kling-video/v2/master/image-to-video" },
  "sadtalker": { endpoint: "fal-ai/sadtalker" },
  "sync-lipsync": { endpoint: "fal-ai/sync-lipsync" },
  // Effects
  "pika-magic": { endpoint: "fal-ai/minimax/video-01" },
  "luma-modify": { endpoint: "fal-ai/luma-dream-machine" },
  "pixverse-effects": { endpoint: "fal-ai/minimax/video-01" },
  "perf-capture": { endpoint: "fal-ai/minimax/video-01" },
  "dreamactor-v2": { endpoint: "fal-ai/minimax/video-01/image-to-video" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model, image_url } = await req.json();
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    const modelConfig = VIDEO_MODEL_MAP[model] || VIDEO_MODEL_MAP["megsy-video"];
    const endpoint = modelConfig.endpoint;

    const input: Record<string, any> = { prompt: prompt || "A cinematic video" };
    if (image_url) input.image_url = image_url;

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

    // Poll for result (videos take longer)
    let result = null;
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 3000));
      
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
        throw new Error("Video generation failed");
      }
    }

    if (!result) throw new Error("Generation timed out");

    let videoUrl = "";
    if (result.video?.url) {
      videoUrl = result.video.url;
    } else if (result.output?.url) {
      videoUrl = result.output.url;
    }

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
