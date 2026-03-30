import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, style, slideCount, templateId } = await req.json();
    if (!topic || !style || !slideCount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader || "" } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Deduct credits: 1 per 10 slides
    const creditCost = Math.ceil(slideCount / 10);
    const { data: creditResult } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: creditCost, p_action_type: "slides", p_description: `Generated ${slideCount} slides: ${topic.slice(0, 50)}`
    });
    if (!creditResult?.success) {
      return new Response(JSON.stringify({ error: creditResult?.error || "Insufficient credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate slide content via Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const contentPrompt = `Generate a ${style} presentation about "${topic}" with exactly ${slideCount} slides.

For each slide, output a JSON object with:
- "title": slide title
- "content": array of 3-5 bullet points
- "imagePrompt": a detailed prompt to generate an illustration for this slide
- "speakerNotes": brief speaker notes

Output ONLY a valid JSON array of slide objects. No markdown, no explanation.
Example: [{"title":"...","content":["..."],"imagePrompt":"...","speakerNotes":"..."}]`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a presentation expert. Output only valid JSON arrays." },
          { role: "user", content: contentPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI error: ${aiRes.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Clean JSON from markdown fences
    rawContent = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    let slidesData: any[];
    try {
      slidesData = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse slides JSON:", rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate images for each slide using deapi.ai
    const slides = [];
    for (const slide of slidesData) {
      let imageUrl: string | undefined;
      
      // Try to get a deapi key for image generation
      const { data: keyRow } = await supabase
        .from("deapi_keys")
        .select("api_key, id")
        .eq("is_active", true)
        .order("usage_count", { ascending: true })
        .limit(1)
        .single();

      if (keyRow && slide.imagePrompt) {
        try {
          const imgRes = await fetch("https://api.deapi.ai/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${keyRow.api_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "black-forest-labs/FLUX.1-schnell",
              prompt: slide.imagePrompt,
              n: 1,
              size: "1024x576",
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            imageUrl = imgData.data?.[0]?.url;
            
            // Update usage count
            await supabase.from("deapi_keys").update({
              usage_count: (keyRow as any).usage_count + 1,
              last_used_at: new Date().toISOString(),
            } as any).eq("id", keyRow.id);
          }
        } catch (imgErr) {
          console.error("Image generation error:", imgErr);
        }
      }

      slides.push({
        title: slide.title,
        content: slide.content || [],
        imageUrl: imageUrl || undefined,
        speakerNotes: slide.speakerNotes || "",
      });
    }

    return new Response(JSON.stringify({ slides }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Generate slides error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
