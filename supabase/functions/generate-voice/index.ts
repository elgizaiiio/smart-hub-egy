import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { model_id, prompt, type, settings } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try lemondata_keys first, fallback to deapi_keys
    let keys: any[] = [];
    let keyTable = "lemondata_keys";
    
    const { data: lemonKeys } = await supabase
      .from("lemondata_keys")
      .select("api_key, id, usage_count")
      .eq("is_active", true)
      .eq("is_blocked", false)
      .limit(10);
    
    if (lemonKeys && lemonKeys.length > 0) {
      keys = lemonKeys;
    } else {
      const { data: deapiKeys } = await supabase
        .from("deapi_keys")
        .select("api_key, id, usage_count")
        .eq("is_active", true)
        .limit(10);
      if (deapiKeys && deapiKeys.length > 0) {
        keys = deapiKeys;
        keyTable = "deapi_keys";
      }
    }

    if (keys.length === 0) throw new Error("No active API keys available");

    const key = keys[Math.floor(Math.random() * keys.length)];

    // Determine API base URL based on key source
    const isLemon = keyTable === "lemondata_keys";
    const apiBase = isLemon ? "https://api.lemondata.ai" : "https://api.deapi.ai";

    // Map model_id to endpoint
    const MODEL_MAP: Record<string, { endpoint: string; params: Record<string, any> }> = {
      "suno-music": {
        endpoint: `${apiBase}/v1/audio/generations`,
        params: { model: "suno-music", prompt },
      },
      "qwen3-tts-custom": {
        endpoint: `${apiBase}/v1/audio/speech`,
        params: { model: "qwen3-tts-customvoice", input: prompt },
      },
      "qwen3-tts-design": {
        endpoint: `${apiBase}/v1/audio/speech`,
        params: { model: "qwen3-tts-voicedesign", input: prompt },
      },
      "qwen3-tts-clone": {
        endpoint: `${apiBase}/v1/audio/speech`,
        params: { model: "qwen3-tts-voiceclone", input: prompt },
      },
      "chatterbox": {
        endpoint: `${apiBase}/v1/audio/speech`,
        params: { model: "chatterbox", input: prompt },
      },
      "kokoro": {
        endpoint: `${apiBase}/v1/audio/speech`,
        params: { model: "kokoro", input: prompt },
      },
      "ace-step-turbo": {
        endpoint: `${apiBase}/v1/audio/generations`,
        params: { model: "ace-step-1.5-turbo", prompt },
      },
      "ace-step-base": {
        endpoint: `${apiBase}/v1/audio/generations`,
        params: { model: "ace-step-1.5-base", prompt },
      },
    };

    const modelConfig = MODEL_MAP[model_id];
    if (!modelConfig) throw new Error(`Unknown model: ${model_id}`);

    // Add any extra settings
    const body = { ...modelConfig.params, ...(settings || {}) };

    const resp = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Update usage count
    await supabase.from("deapi_keys").update({
      usage_count: (key as any).usage_count + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", key.id);

    if (!resp.ok) {
      const errText = await resp.text();
      // Mark key inactive on auth errors
      if (resp.status === 401 || resp.status === 403) {
        await supabase.from("deapi_keys").update({ is_active: false }).eq("id", key.id);
      }
      throw new Error(`deapi error ${resp.status}: ${errText}`);
    }

    const contentType = resp.headers.get("content-type") || "";

    // Audio binary response
    if (contentType.includes("audio") || contentType.includes("octet-stream")) {
      const audioData = await resp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      const audioUrl = `data:audio/mp3;base64,${base64}`;

      return new Response(JSON.stringify({ success: true, url: audioUrl, model: model_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON response (may contain URL)
    const data = await resp.json();
    const url = data.url || data.audio_url || data.output?.url || data.data?.[0]?.url;

    return new Response(JSON.stringify({ success: true, url: url || null, data, model: model_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-voice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
