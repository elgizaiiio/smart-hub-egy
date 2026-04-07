import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const claudeMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    if (action === "build") {
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

      const allMessages = [...claudeMessages, { role: "user", content: "Build the project now. Output only ===FILE: path=== blocks." }];

      // Always stream directly - no tool loop to avoid WORKER_LIMIT
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 12000,
          system: buildPrompt,
          messages: allMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
      }

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  const openaiChunk = {
                    choices: [{ delta: { content: parsed.delta.text } }],
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                } else if (parsed.type === "message_stop") {
                  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                }
              } catch {}
            }
          }
        },
      });

      return new Response(response.body!.pipeThrough(transformStream), {
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
