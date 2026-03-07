import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, mode } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Determine which gateway to use based on model
    let apiUrl: string;
    let apiKey: string;
    let modelId: string;

    // Route models to appropriate providers
    const lovableModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview"];
    const requestedModel = model || "openai/gpt-5";

    if (lovableModels.some(m => requestedModel.includes(m))) {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      modelId = requestedModel.startsWith("google/") ? requestedModel : `google/${requestedModel}`;
    } else {
      if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      apiKey = OPENROUTER_API_KEY;
      modelId = requestedModel;
    }

    // System prompt based on mode
    let systemPrompt: string;
    if (mode === "files") {
      systemPrompt = "You are Megsy, a document creation assistant. Create comprehensive, detailed, well-structured documents. When asked to generate HTML documents, make them professional, thorough, and visually polished with proper CSS styling. Include all relevant sections, details, and content. Never create abbreviated or shortened documents. Output complete, production-quality work.";
    } else {
      systemPrompt = `You are Megsy, a friendly AI assistant and the user's buddy. Rules:
- Match the user's language and dialect exactly. If they write in Egyptian Arabic, respond in Egyptian Arabic. If English, respond in English.
- Be concise for simple questions (1-3 sentences). Be detailed and thorough for complex questions, coding help, or when the user clearly needs depth.
- Adapt to the user's mood - be supportive when they're frustrated, enthusiastic when they're excited, casual when they're relaxed.
- Never use emoji in your responses. Not a single one.
- Use markdown formatting when it helps: bold for emphasis, code blocks for code, bullet points for lists.
- Be direct and honest. Don't over-explain simple things.
- When the user greets you casually, respond casually and briefly.`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://egy.app", "X-Title": "egy" } : {}),
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
