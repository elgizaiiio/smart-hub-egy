import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEMON_BASE = "https://api.lemondata.cc";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { model_id, prompt, type, settings } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get active lemondata key
    const { data: lemonKeys } = await supabase
      .from("lemondata_keys")
      .select("api_key, id, usage_count")
      .eq("is_active", true)
      .eq("is_blocked", false)
      .limit(20);

    if (!lemonKeys || lemonKeys.length === 0) throw new Error("No active API keys available");
    const key = lemonKeys[Math.floor(Math.random() * lemonKeys.length)];

    const isMusic = model_id === "suno-music" || model_id === "ace-step-turbo" || model_id === "ace-step-base";

    if (isMusic) {
      // ═══ MUSIC: async poll-based via /v1/music/generations ═══
      const musicBody: Record<string, any> = {
        model: "suno_music",
        prompt,
      };
      if (settings?.title) musicBody.title = settings.title;
      if (settings?.tags) musicBody.tags = settings.tags;
      if (settings?.duration) musicBody.duration = settings.duration;

      console.log("Music generation request:", JSON.stringify(musicBody));

      const createResp = await fetch(`${LEMON_BASE}/v1/music/generations`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify(musicBody),
      });

      if (!createResp.ok) {
        const errText = await createResp.text();
        if (createResp.status === 401 || createResp.status === 403) {
          supabase.from("lemondata_keys").update({ is_blocked: true, block_reason: `HTTP ${createResp.status}` }).eq("id", key.id);
        }
        throw new Error(`Music API error ${createResp.status}: ${errText}`);
      }

      const createData = await createResp.json();
      const taskId = createData.id || createData.task_id;
      if (!taskId) {
        // If response already has audio_url, return directly
        const directUrl = createData.audio_url || createData.url || createData.data?.[0]?.audio_url;
        if (directUrl) {
          return new Response(JSON.stringify({ success: true, url: directUrl, model: model_id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("No task ID returned from music API");
      }

      // Poll for completion (max 120s)
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 3000));

        const pollResp = await fetch(`${LEMON_BASE}/v1/music/generations/${taskId}`, {
          headers: { "Authorization": `Bearer ${key.api_key}` },
        });

        if (!pollResp.ok) {
          const pollErr = await pollResp.text();
          console.error("Poll error:", pollResp.status, pollErr);
          continue;
        }

        const pollData = await pollResp.json();
        console.log("Poll status:", pollData.status, "progress:", pollData.progress);

        if (pollData.status === "completed") {
          const audioUrl = pollData.audio_url || pollData.url || pollData.data?.[0]?.audio_url;
          // Update usage
          supabase.from("lemondata_keys").update({
            usage_count: (key.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          }).eq("id", key.id);

          return new Response(JSON.stringify({
            success: true,
            url: audioUrl,
            video_url: pollData.video_url || null,
            title: pollData.title || null,
            lyrics: pollData.lyrics || null,
            model: model_id,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (pollData.status === "failed") {
          throw new Error("Music generation failed: " + (pollData.error || "Unknown"));
        }
      }
      throw new Error("Music generation timed out after 120s");

    } else {
      // ═══ TTS/VOICE: synchronous via /v1/audio/speech ═══
      const ttsBody: Record<string, any> = { input: prompt };

      // Map model_id to LemonData TTS model
      ttsBody.model = "tts-1-hd";

      // Voice selection
      if (settings?.voice) ttsBody.voice = settings.voice;
      else ttsBody.voice = "nova";

      if (settings?.speed) ttsBody.speed = settings.speed;
      if (settings?.response_format) ttsBody.response_format = settings.response_format;

      console.log("TTS request:", JSON.stringify({ ...ttsBody, input: ttsBody.input?.slice(0, 50) }));

      const resp = await fetch(`${LEMON_BASE}/v1/audio/speech`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      });

      // Update usage (fire-and-forget)
      supabase.from("lemondata_keys").update({
        usage_count: (key.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      }).eq("id", key.id);

      if (!resp.ok) {
        const errText = await resp.text();
        if (resp.status === 401 || resp.status === 403) {
          supabase.from("lemondata_keys").update({ is_blocked: true, block_reason: `HTTP ${resp.status}` }).eq("id", key.id);
        }
        throw new Error(`TTS API error ${resp.status}: ${errText}`);
      }

      const contentType = resp.headers.get("content-type") || "";

      if (contentType.includes("audio") || contentType.includes("octet-stream")) {
        const audioData = await resp.arrayBuffer();
        const base64 = base64Encode(new Uint8Array(audioData));
        return new Response(JSON.stringify({ success: true, url: `data:audio/mp3;base64,${base64}`, model: model_id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const url = data.url || data.audio_url || data.output?.url || data.data?.[0]?.url;
      return new Response(JSON.stringify({ success: true, url: url || null, data, model: model_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("generate-voice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});