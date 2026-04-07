import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sticky key cache
let cachedKey: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getLemonDataKey(): Promise<string> {
  if (cachedKey && Date.now() - cacheTime < CACHE_TTL) return cachedKey;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase
    .from("lemondata_keys")
    .select("api_key")
    .eq("is_active", true)
    .eq("is_blocked", false)
    .order("usage_count", { ascending: true })
    .limit(1)
    .single();

  if (!data?.api_key) throw new Error("No active LemonData keys available");

  cachedKey = data.api_key;
  cacheTime = Date.now();

  // Background: update usage
  supabase
    .from("lemondata_keys")
    .update({ last_used_at: new Date().toISOString(), usage_count: 1 })
    .eq("api_key", data.api_key)
    .then(() => {});

  return data.api_key;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action } = await req.json();

    if (action === "build") {
      const apiKey = await getLemonDataKey();

      const buildPrompt = `You are Megsy Code, an expert full-stack AI programming agent. Generate a complete React+Vite project with Tailwind CSS.

IMPORTANT BEHAVIOR:
- Mirror the user's language and dialect exactly. If they write in Egyptian Arabic, respond in Egyptian Arabic. If English, respond in English.
- Before generating code, mentally plan which pages, components, and features to build.
- Generate clean, production-ready, fully responsive code.

OUTPUT FORMAT (CRITICAL - follow exactly):
For each file, output:
===FILE: path/to/file===
file content here
===END===

Rules:
- Use React with JSX (.jsx files)
- Use react-router-dom for multi-page apps (BrowserRouter)
- Tailwind CSS for all styling
- Keep files in src/ directory
- Include proper error handling and responsive design
- Do NOT include package.json, vite.config.js, index.html, src/main.jsx, src/index.css, tailwind.config.js, postcss.config.js unless you need to modify defaults
- Make the UI modern, clean, and fully responsive
- Include all necessary components, pages, hooks, and utilities
- Use semantic HTML and accessible patterns
- Do NOT wrap output in markdown code blocks
- Output ONLY the ===FILE=== blocks, no other text`;

      const claudeMessages = messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

      const allMessages = [
        { role: "system", content: buildPrompt },
        ...claudeMessages,
        { role: "user", content: "Build the project now. Output only ===FILE: path=== blocks." },
      ];

      const response = await fetch("https://api.lemondata.cc/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          messages: allMessages,
          stream: true,
          max_tokens: 12000,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        // Block key on auth errors
        if (response.status === 401 || response.status === 403) {
          cachedKey = null;
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
          );
          supabase.from("lemondata_keys").update({
            is_active: false,
            is_blocked: true,
            block_reason: `API error ${response.status}`,
          }).eq("api_key", apiKey).then(() => {});
        }
        throw new Error(`LemonData API error ${response.status}: ${err}`);
      }

      // LemonData returns OpenAI-compatible SSE, pass through directly
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("code-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
