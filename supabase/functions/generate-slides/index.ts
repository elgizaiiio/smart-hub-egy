import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, content, templateId, tier } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const apiKey = Deno.env.get("TWOSLIDES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        error: "2Slides API key not configured.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isPro = tier === "pro";

    // Build request body for 2slides.com API
    const body: Record<string, any> = {
      topic,
      content: content || topic,
    };

    if (templateId) {
      body.template_id = templateId;
    }

    if (isPro) {
      body.model = "nano-banana-pro";
    }

    console.log("Calling 2slides API with:", JSON.stringify({ topic, templateId, isPro }));

    const resp = await fetch("https://api.2slides.com/v1/presentations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("2slides error:", resp.status, errText);
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        error: "Slide generation service temporarily unavailable.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const downloadUrl = data.download_url || data.url || data.pptx_url;

    return new Response(JSON.stringify({
      success: !!downloadUrl,
      download_url: downloadUrl || null,
      preview_url: data.preview_url || null,
      slide_count: data.slide_count || 10,
      title: data.title || topic,
      fallback: !downloadUrl,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(
      JSON.stringify({ success: false, fallback: true, error: "Presentation generation failed." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
