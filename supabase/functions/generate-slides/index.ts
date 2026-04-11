import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://2slides.com";

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

    const authHeaders = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (isPro) {
      // Nano Banana Pro: POST /api/v1/slides/create-like-this (synchronous)
      const body: Record<string, any> = {
        userInput: content || topic,
        responseLanguage: "Auto",
        aspectRatio: "16:9",
        resolution: "2K",
        page: 0, // auto-detect
        contentDetail: "standard",
      };

      // For pro without template, we need a referenceImageUrl
      // Use a generic professional slide reference
      body.referenceImageUrl = "https://2slides.com/_next/image?url=/login_preview/st-1763716811881-gt30ikwgk_slide1.webp&w=640&q=75";

      console.log("Calling create-like-this (Pro)...");
      const resp = await fetch(`${BASE_URL}/api/v1/slides/create-like-this`, {
        method: "POST",
        headers: authHeaders,
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
      console.log("Pro response:", JSON.stringify(data));

      const downloadUrl = data?.data?.downloadUrl || data?.downloadUrl;
      const slideCount = data?.data?.slidePageCount || data?.data?.successCount || 10;

      if (data?.success && downloadUrl) {
        // Deduct credits
        if (userId) {
          try {
            const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
            await sb.rpc("deduct_credits", { p_user_id: userId, p_amount: 2, p_action_type: "slides_pro", p_description: "Slides Pro generation" });
          } catch (e) { console.error("Credit deduction failed:", e); }
        }
        return new Response(JSON.stringify({
          success: true, download_url: downloadUrl, slide_count: slideCount, title: topic,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: false, fallback: true, error: data?.data?.message || "Pro generation failed.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else {
      // Fast PPT: POST /api/v1/slides/generate (sync mode)
      const body: Record<string, any> = {
        userInput: content || topic,
        responseLanguage: "Auto",
        mode: "sync",
      };

      if (templateId) {
        body.themeId = templateId;
      }

      console.log("Calling slides/generate (Fast PPT)...");
      const resp = await fetch(`${BASE_URL}/api/v1/slides/generate`, {
        method: "POST",
        headers: authHeaders,
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
      console.log("Fast PPT response:", JSON.stringify(data));

      // Response: { success: true, data: { downloadUrl, slidePageCount, ... } }
      const downloadUrl = data?.data?.downloadUrl || data?.downloadUrl;
      const slideCount = data?.data?.slidePageCount || 10;
      const jobId = data?.data?.jobId;

      if (data?.success && downloadUrl) {
        return new Response(JSON.stringify({
          success: true, download_url: downloadUrl, slide_count: slideCount, title: topic,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // If async job was returned instead of sync result, poll for it
      if (data?.success && jobId && !downloadUrl) {
        console.log("Got jobId, polling:", jobId);
        for (let i = 0; i < 12; i++) {
          await new Promise(r => setTimeout(r, 15000));
          try {
            const jobResp = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}`, { headers: authHeaders });
            if (!jobResp.ok) continue;
            const jobData = await jobResp.json();
            console.log(`Poll ${i + 1}:`, JSON.stringify(jobData));
            const jd = jobData?.data || jobData;
            if (jd.status === "success") {
              return new Response(JSON.stringify({
                success: true, download_url: jd.downloadUrl, slide_count: jd.slidePageCount || 10, title: topic,
              }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
            if (jd.status === "failed") break;
          } catch {}
        }
      }

      return new Response(JSON.stringify({
        success: false, fallback: true, error: "Slide generation did not return a download.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(
      JSON.stringify({ success: false, fallback: true, error: "Presentation generation failed." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
