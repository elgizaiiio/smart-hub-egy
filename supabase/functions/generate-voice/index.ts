import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEMON_BASE = "https://api.lemondata.cc";

function initSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getKey(supabase: any, specificId?: string) {
  if (specificId) {
    const { data } = await supabase.from("lemondata_keys").select("api_key, id, usage_count").eq("id", specificId).single();
    if (!data) throw new Error("Key not found");
    return data;
  }
  const { data: keys } = await supabase.from("lemondata_keys").select("api_key, id, usage_count").eq("is_active", true).eq("is_blocked", false).limit(20);
  if (!keys?.length) throw new Error("NO_KEYS");
  return keys[Math.floor(Math.random() * keys.length)];
}

async function blockKey(supabase: any, keyId: string, reason: string) {
  await supabase.from("lemondata_keys").update({ is_blocked: true, block_reason: reason }).eq("id", keyId);
}

async function bumpUsage(supabase: any, key: any) {
  supabase.from("lemondata_keys").update({ usage_count: (key.usage_count || 0) + 1, last_used_at: new Date().toISOString() }).eq("id", key.id);
}

// ─── MUSIC ───
async function handleMusic(supabase: any, key: any, prompt: string, settings: any, model_id: string) {
  const musicBody: Record<string, any> = { model: "suno_music", prompt };
  if (settings?.title) musicBody.title = settings.title;
  if (settings?.tags) musicBody.tags = settings.tags;

  const resp = await fetch(`${LEMON_BASE}/v1/music/generations`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key.api_key}`, "Content-Type": "application/json" },
    body: JSON.stringify(musicBody),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Music API error:", resp.status, errText);
    // Block key on auth/quota errors and signal retry
    if (resp.status === 401 || resp.status === 403 || resp.status === 402) {
      await blockKey(supabase, key.id, `HTTP ${resp.status}`);
      return { retry: true, error: `Music service quota exceeded` };
    }
    return { error: "Music generation is temporarily unavailable. Please try again later.", fallback: true };
  }

  const data = await resp.json();
  const directUrl = data.audio_url || data.url || data.data?.[0]?.audio_url;
  if (directUrl) {
    await bumpUsage(supabase, key);
    return { success: true, status: "completed", url: directUrl, model: model_id };
  }

  const taskId = data.id || data.task_id;
  if (!taskId) return { error: "No task ID returned", fallback: true };

  return { success: true, status: "pending", task_id: taskId, key_id: key.id };
}

// ─── POLL ───
async function handlePoll(supabase: any, key: any, taskId: string) {
  const resp = await fetch(`${LEMON_BASE}/v1/music/generations/${taskId}`, {
    headers: { "Authorization": `Bearer ${key.api_key}` },
  });
  if (!resp.ok) {
    const t = await resp.text();
    return { success: false, status: "failed", error: "Could not check generation status" };
  }
  const d = await resp.json();
  if (d.status === "completed") {
    await bumpUsage(supabase, key);
    return { success: true, status: "completed", url: d.audio_url || d.url || d.data?.[0]?.audio_url, video_url: d.video_url || null, title: d.title || null, lyrics: d.lyrics || null };
  }
  if (d.status === "failed") return { success: false, status: "failed", error: "Generation failed" };
  return { success: false, status: d.status || "processing" };
}

// ─── TTS ───
async function handleTTS(supabase: any, key: any, prompt: string, settings: any, model_id: string) {
  const voice = settings?.voice || "nova";
  const speed = settings?.speed || 1;
  const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");

  // Try OpenRouter first
  if (OPENROUTER_KEY) {
    try {
      const orResp = await Promise.race([
        fetch("https://openrouter.ai/api/v1/audio/speech", {
          method: "POST",
          headers: { "Authorization": `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "openai/tts-1", input: prompt, voice, speed }),
        }),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000)),
      ]) as Response;

      if (orResp.ok) {
        const ct = orResp.headers.get("content-type") || "";
        if (ct.includes("audio") || ct.includes("octet-stream")) {
          const buf = await orResp.arrayBuffer();
          return { success: true, url: `data:audio/mp3;base64,${base64Encode(new Uint8Array(buf))}`, model: model_id };
        }
        const data = await orResp.json();
        const url = data.url || data.audio_url || data.output?.url;
        if (url) return { success: true, url, model: model_id };
      } else {
        // consume body
        await orResp.text();
      }
    } catch (e) {
      console.error("OpenRouter TTS fallback:", e);
    }
  }

  // Fallback: LemonData
  const ttsBody: Record<string, any> = { input: prompt, model: "tts-1-hd", voice };
  if (speed) ttsBody.speed = speed;
  if (settings?.response_format) ttsBody.response_format = settings.response_format;

  try {
    const resp = await Promise.race([
      fetch(`${LEMON_BASE}/v1/audio/speech`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 25000)),
    ]) as Response;

    await bumpUsage(supabase, key);

    if (!resp.ok) {
      const errText = await resp.text();
      if (resp.status === 401 || resp.status === 402 || resp.status === 403) {
        await blockKey(supabase, key.id, `HTTP ${resp.status}`);
      }
      return { error: "Voice generation is temporarily unavailable.", fallback: true };
    }

    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("audio") || ct.includes("octet-stream")) {
      const buf = await resp.arrayBuffer();
      return { success: true, url: `data:audio/mp3;base64,${base64Encode(new Uint8Array(buf))}`, model: model_id };
    }

    const data = await resp.json();
    const url = data.url || data.audio_url || data.output?.url || data.data?.[0]?.url;
    return { success: true, url: url || null, data, model: model_id };
  } catch (e) {
    console.error("LemonData TTS error:", e);
    return { error: "Voice generation timed out. Please try again.", fallback: true };
  }
}

// ─── MAIN ───
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { model_id, prompt, type, settings, poll_task_id, poll_key_id } = await req.json();
    const supabase = initSupabase();

    // POLL MODE
    if (poll_task_id) {
      const key = await getKey(supabase, poll_key_id);
      const result = await handlePoll(supabase, key, poll_task_id);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Text is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const normalizedModelId = String(model_id ?? "").replace(/-/g, "_").toLowerCase();
    const isMusic = type === "music" || normalizedModelId === "suno_music" || normalizedModelId === "ace_step_turbo" || normalizedModelId === "ace_step_base";

    if (isMusic) {
      // Try up to 3 different keys if quota errors
      for (let attempt = 0; attempt < 3; attempt++) {
        const key = await getKey(supabase);
        const result = await handleMusic(supabase, key, prompt, settings, model_id);
        if (result.retry) {
          console.log(`Key ${key.id} blocked, retrying with another key (attempt ${attempt + 1})`);
          continue;
        }
        const status = result.error && !result.success ? 200 : 200; // always 200, use fallback flag
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Music generation is temporarily unavailable. All service accounts are exhausted.", fallback: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const key = await getKey(supabase);
      const result = await handleTTS(supabase, key, prompt, settings, model_id);
      const httpStatus = result.fallback ? 200 : 200;
      return new Response(JSON.stringify(result), { status: httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("generate-voice error:", e);
    const isNoKeys = e instanceof Error && e.message === "NO_KEYS";
    return new Response(
      JSON.stringify({
        error: isNoKeys ? "Voice service is temporarily unavailable. Please try again later." : "Voice generation failed. Please try again.",
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
