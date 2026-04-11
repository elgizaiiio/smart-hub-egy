import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function pollJob(jobId: string, apiKey: string, maxAttempts = 12): Promise<{ status: string; downloadUrl?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 20000)); // 20s interval
    const resp = await fetch(`https://2slides.com/api/v1/jobs/${jobId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!resp.ok) continue;
    const data = await resp.json();
    console.log(`Poll attempt ${i + 1}:`, JSON.stringify(data));
    if (data.status === "success" || data.status === "completed") {
      return { status: "success", downloadUrl: data.downloadUrl || data.download_url || data.url };
    }
    if (data.status === "failed" || data.status === "error") {
      return { status: "failed" };
    }
  }
  return { status: "timeout" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, content, templateId, tier, userId } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const apiKey = Deno.env.get("TWOSLIDES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false, fallback: true, error: "2Slides API key not configured.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isPro = tier === "pro";
    console.log("generate-slides:", JSON.stringify({ topic: topic.slice(0, 50), templateId, isPro }));

    if (isPro) {
      // Pro Mode: Nano Banana - async with job polling
      const body = {
        userInput: content || topic,
        mode: "async",
      };

      const resp = await fetch("https://2slides.com/api/v1/slides/create-pdf-slides", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("2slides pro error:", resp.status, errText);
        return new Response(JSON.stringify({
          success: false, fallback: true, error: "Pro slide generation failed.",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const jobId = data.jobId || data.job_id || data.id;

      if (!jobId) {
        // Maybe it returned synchronously
        const downloadUrl = data.downloadUrl || data.download_url || data.url;
        if (downloadUrl) {
          // Deduct credits
          if (userId) {
            const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
            await sb.rpc("deduct_credits", { p_user_id: userId, p_amount: 2, p_action_type: "slides_pro", p_description: "Slides Pro generation" });
          }
          return new Response(JSON.stringify({
            success: true, download_url: downloadUrl, slide_count: data.slideCount || 10, title: topic,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({
          success: false, fallback: true, error: "No job ID returned.",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Poll for completion
      const result = await pollJob(jobId, apiKey);
      if (result.status === "success" && result.downloadUrl) {
        // Deduct credits
        if (userId) {
          const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
          await sb.rpc("deduct_credits", { p_user_id: userId, p_amount: 2, p_action_type: "slides_pro", p_description: "Slides Pro generation" });
        }
        return new Response(JSON.stringify({
          success: true, download_url: result.downloadUrl, slide_count: 10, title: topic,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: false, fallback: true, error: result.status === "timeout" ? "Generation timed out." : "Generation failed.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else {
      // Normal Mode: Fast PPT with template
      const body: Record<string, any> = {
        userInput: content || topic,
        responseLanguage: "Auto",
        mode: "sync",
      };

      if (templateId) {
        body.themeId = templateId;
      }

      const resp = await fetch("https://2slides.com/api/v1/slides/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("2slides normal error:", resp.status, errText);
        return new Response(JSON.stringify({
          success: false, fallback: true, error: "Slide generation failed.",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const downloadUrl = data.downloadUrl || data.download_url || data.url || data.pptx_url;

      return new Response(JSON.stringify({
        success: !!downloadUrl,
        download_url: downloadUrl || null,
        preview_url: data.preview_url || data.previewUrl || null,
        slide_count: data.slideCount || data.slide_count || 10,
        title: data.title || topic,
        fallback: !downloadUrl,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(
      JSON.stringify({ success: false, fallback: true, error: "Presentation generation failed." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
