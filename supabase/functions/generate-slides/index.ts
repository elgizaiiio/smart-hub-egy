import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, slide_count, style, content_outline, language } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get MagicSlides API key from api_keys table with rotation
    const { data: keys } = await sb
      .from("api_keys")
      .select("id, api_key, usage_count")
      .eq("service", "magicslides")
      .eq("is_active", true)
      .eq("is_blocked", false)
      .limit(10);

    if (!keys || keys.length === 0) {
      // Fallback: generate HTML slides via AI
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        error: "Slide service not configured. Please add MagicSlides API keys.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const key = keys[Math.floor(Math.random() * keys.length)];

    // Call MagicSlides API
    const slideCount = Math.min(Math.max(slide_count || 10, 5), 20);
    const body: Record<string, any> = {
      topic,
      slide_count: slideCount,
      style: style || "professional",
      language: language || "auto",
    };
    if (content_outline) body.content = content_outline;

    const resp = await fetch("https://api.magicslides.app/v1/presentations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Track usage
    sb.from("api_keys").update({
      usage_count: (key.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", key.id).then(() => {});

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("MagicSlides error:", resp.status, errText);
      if (resp.status === 401 || resp.status === 403) {
        sb.from("api_keys").update({
          is_blocked: true,
          block_reason: `HTTP ${resp.status}`,
        }).eq("id", key.id).then(() => {});
      }
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        error: "Presentation service temporarily unavailable. Please try again.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const downloadUrl = data.download_url || data.url || data.pptx_url;

    return new Response(JSON.stringify({
      success: true,
      download_url: downloadUrl,
      preview_url: data.preview_url || null,
      slide_count: slideCount,
      title: data.title || topic,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(
      JSON.stringify({ error: "Presentation generation failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
