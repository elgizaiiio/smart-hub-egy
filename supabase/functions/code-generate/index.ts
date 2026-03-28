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

    if (action === "plan") {
      // Planning mode - conversational
      const systemPrompt = `You are Megsy Code, an expert full-stack AI programming agent. You build complete React applications with:
- React + Vite + React Router
- Tailwind CSS for styling  
- Multiple pages/routes with react-router-dom
- Component-based architecture
- Clean, production-ready code

Analyze the user's request thoroughly:
1. Understand the full scope (pages, components, features)
2. Outline a detailed plan with file structure, tech stack, and features
3. Ask clarifying questions if the request is ambiguous
4. Plan: Pages → Components → Styling → Interactivity

Be conversational. Do not use emoji. Respond in the user's language. Keep plans structured and actionable.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: systemPrompt,
          messages: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
      }

      // Transform Claude SSE to OpenAI-compatible SSE format
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  // Convert to OpenAI format
                  const openaiChunk = {
                    choices: [{ delta: { content: parsed.delta.text } }],
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                } else if (parsed.type === "message_stop") {
                  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                }
              } catch {
                // skip non-JSON lines
              }
            }
          }
        },
      });

      const stream = response.body!.pipeThrough(transformStream);

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    if (action === "build") {
      // Build mode - generate complete project files
      const buildPrompt = `You are Megsy Code in build mode. Based on the conversation, generate a complete React+Vite project with Tailwind CSS.

Output ONLY a valid JSON object: {"files":{"path":"content",...}}

Rules:
- Use React with JSX (.jsx files)
- Use react-router-dom for multi-page apps (BrowserRouter)
- Tailwind CSS for all styling
- Keep files in src/ directory
- Include proper error handling and responsive design
- Do NOT include package.json, vite.config.js, index.html, src/main.jsx, src/index.css, tailwind.config.js, postcss.config.js unless you need to modify defaults
- Output raw JSON only, no markdown code blocks
- Make the UI modern, clean, and fully responsive
- Include all necessary components, pages, hooks, and utilities
- Use semantic HTML and accessible patterns`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16384,
          system: buildPrompt,
          messages: [
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: "Build the project now. Output only JSON." },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
      }

      // Same transform for build mode
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
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

      const stream = response.body!.pipeThrough(transformStream);

      return new Response(stream, {
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
