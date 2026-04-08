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
    const { model_id, prompt, type, settings, poll_task_id, poll_key_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let key: { api_key: string; id: string; usage_count: number };

    if (poll_key_id) {
      // Use the exact same key that created the task
      const { data: exactKey } = await supabase
        .from("lemondata_keys")
        .select("api_key, id, usage_count")
        .eq("id", poll_key_id)
        .single();
      if (!exactKey) throw new Error("Poll key not found");
      key = exactKey;
    } else {
      const { data: lemonKeys } = await supabase
        .from("lemondata_keys")
        .select("api_key, id, usage_count")
        .eq("is_active", true)
        .eq("is_blocked", false)
        .limit(20);
      if (!lemonKeys || lemonKeys.length === 0) throw new Error("No active API keys available");
      key = lemonKeys[Math.floor(Math.random() * lemonKeys.length)];
    }

    // ═══ POLL MODE: check status of existing music task ═══
    if (poll_task_id) {
      const pollResp = await fetch(`${LEMON_BASE}/v1/music/generations/${poll_task_id}`, {
        headers: { "Authorization": `Bearer ${key.api_key}` },
      });
      if (!pollResp.ok) {
        const errText = await pollResp.text();
        throw new Error(`Poll error ${pollResp.status}: ${errText}`);
      }
      const pollData = await pollResp.json();
      
      if (pollData.status === "completed") {
        const audioUrl = pollData.audio_url || pollData.url || pollData.data?.[0]?.audio_url;
        supabase.from("lemondata_keys").update({
          usage_count: (key.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        }).eq("id", key.id);

        return new Response(JSON.stringify({
          success: true, status: "completed", url: audioUrl,
          video_url: pollData.video_url || null,
          title: pollData.title || null, lyrics: pollData.lyrics || null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (pollData.status === "failed") {
        return new Response(JSON.stringify({ success: false, status: "failed", error: pollData.error || "Unknown" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, status: pollData.status || "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!prompt) throw new Error("Prompt is required");

    const normalizedModelId = String(model_id ?? "").replace(/-/g, "_").toLowerCase();
    const isMusic = type === "music" || normalizedModelId === "suno_music" || normalizedModelId === "ace_step_turbo" || normalizedModelId === "ace_step_base";

    if (isMusic) {
      // ═══ MUSIC: submit task and return task_id immediately ═══
      console.log("Music generation request:", { model: "suno_music", prompt: prompt?.slice(0, 50) });
      const musicBody: Record<string, any> = { model: "suno_music", prompt };
      if (settings?.title) musicBody.title = settings.title;
      if (settings?.tags) musicBody.tags = settings.tags;

      const createResp = await fetch(`${LEMON_BASE}/v1/music/generations`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify(musicBody),
      });

      if (!createResp.ok) {
        const errText = await createResp.text();
        console.error("Music API error:", createResp.status, errText);
        if (createResp.status === 401 || createResp.status === 403) {
          supabase.from("lemondata_keys").update({ is_blocked: true, block_reason: `HTTP ${createResp.status}` }).eq("id", key.id);
        }
        throw new Error(`Music API error ${createResp.status}: ${errText}`);
      }

      const createData = await createResp.json();
      console.log("Music API response:", JSON.stringify(createData).slice(0, 200));
      const taskId = createData.id || createData.task_id;

      // If response already has audio_url, return directly
      const directUrl = createData.audio_url || createData.url || createData.data?.[0]?.audio_url;
      if (directUrl) {
        console.log("Direct audio URL received");
        return new Response(JSON.stringify({ success: true, status: "completed", url: directUrl, model: model_id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!taskId) throw new Error("No task ID returned from music API");

      console.log("Returning task_id for polling:", taskId);
      // Return task_id for client-side polling
      return new Response(JSON.stringify({ success: true, status: "pending", task_id: taskId, key_id: key.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // ═══ TTS/VOICE: Try OpenRouter first (fast), fallback to LemonData ═══
      const ttsInput = prompt;
      const voice = settings?.voice || "nova";
      const speed = settings?.speed || 1;
      const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");

      // Try OpenRouter TTS first (faster)
      if (OPENROUTER_KEY) {
        try {
          const orResp = await Promise.race([
            fetch("https://openrouter.ai/api/v1/audio/speech", {
              method: "POST",
              headers: { "Authorization": `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: "openai/tts-1", input: ttsInput, voice, speed }),
            }),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 25000)),
          ]) as Response;

          if (orResp.ok) {
            const ct = orResp.headers.get("content-type") || "";
            if (ct.includes("audio") || ct.includes("octet-stream")) {
              const audioData = await orResp.arrayBuffer();
              const base64 = base64Encode(new Uint8Array(audioData));
              return new Response(JSON.stringify({ success: true, url: `data:audio/mp3;base64,${base64}`, model: model_id }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            const data = await orResp.json();
            const url = data.url || data.audio_url || data.output?.url;
            if (url) {
              return new Response(JSON.stringify({ success: true, url, model: model_id }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        } catch (orErr) {
          console.error("OpenRouter TTS failed, falling back:", orErr);
        }
      }

      // Fallback: LemonData TTS
      const ttsBody: Record<string, any> = { input: ttsInput, model: "tts-1-hd", voice };
      if (speed) ttsBody.speed = speed;
      if (settings?.response_format) ttsBody.response_format = settings.response_format;

      const resp = await Promise.race([
        fetch(`${LEMON_BASE}/v1/audio/speech`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${key.api_key}`, "Content-Type": "application/json" },
          body: JSON.stringify(ttsBody),
        }),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("TTS timeout")), 30000)),
      ]) as Response;

      supabase.from("lemondata_keys").update({
        usage_count: (key.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      }).eq("id", key.id);

      if (!resp.ok) {
        const errText = await resp.text();
        if (resp.status === 401 || resp.status === 403) {
          supabase.from("lemondata_keys").update({ is_blocked: true, block_reason: `HTTP ${resp.status}` }).eq("id", key.id);
        }
        throw new Error(`Voice service error: ${resp.status}`);
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
    // White-label error messages - never expose provider names
    const msg = e instanceof Error ? e.message : "Unknown error";
    const safeMsg = msg.replace(/lemon|openrouter|deepgram/gi, "service").replace(/api\.lemondata\.cc|openrouter\.ai/gi, "provider");
    return new Response(
      JSON.stringify({ error: safeMsg.includes("timeout") ? "Voice generation timed out. Please try again." : "Voice generation failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
