import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";
const LEMONDATA_URL = "https://api.lemondata.cc/v1/chat/completions";

function safeParseToolArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = cleaned.search(/[\{\[]/);
    const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');
    if (jsonStart === -1 || jsonEnd === -1) return {};
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, ""));
    } catch {
      return {};
    }
  }
}

// ── Smart Key Cache ──
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedKey: { id: string; api_key: string } | null = null;
let cachedKeyExpiry = 0;

async function getLemonDataKey(sb: ReturnType<typeof createClient>, excludeId?: string): Promise<{ id: string; api_key: string } | null> {
  if (cachedKey && Date.now() < cachedKeyExpiry && cachedKey.id !== excludeId) return cachedKey;
  const { data } = await sb.from("lemondata_keys").select("id, api_key").eq("is_active", true).eq("is_blocked", false).limit(50);
  if (!data || data.length === 0) { cachedKey = null; return null; }
  const pool = excludeId ? data.filter((k: any) => k.id !== excludeId) : data;
  if (pool.length === 0) { cachedKey = null; return null; }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  cachedKey = pick;
  cachedKeyExpiry = Date.now() + CACHE_TTL_MS;
  return pick;
}

function blockLemonKey(sb: ReturnType<typeof createClient>, keyId: string, reason: string) {
  if (cachedKey?.id === keyId) cachedKey = null;
  sb.from("lemondata_keys").update({ is_blocked: true, block_reason: reason, last_error_at: new Date().toISOString() }).eq("id", keyId).then(() => {});
}

function markKeyUsed(sb: ReturnType<typeof createClient>, keyId: string) {
  sb.from("lemondata_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyId).then(() => {});
}

const serperKeyCache: { id: string; api_key: string; expiry: number } = { id: "", api_key: "", expiry: 0 };

async function getSerperKey(sb: ReturnType<typeof createClient>): Promise<string | null> {
  if (serperKeyCache.api_key && Date.now() < serperKeyCache.expiry) return serperKeyCache.api_key;
  const { data } = await sb.from("api_keys").select("id, api_key").eq("service", "serper").eq("is_active", true).limit(10);
  if (!data || data.length === 0) return Deno.env.get("SERPER_API_KEY") || null;
  const pick = data[Math.floor(Math.random() * data.length)];
  serperKeyCache.id = pick.id;
  serperKeyCache.api_key = pick.api_key;
  serperKeyCache.expiry = Date.now() + CACHE_TTL_MS;
  return pick.api_key;
}

// Hyperbrowser key cache
const hbKeyCache: { id: string; api_key: string; expiry: number } = { id: "", api_key: "", expiry: 0 };

async function getHyperbrowserKey(sb: ReturnType<typeof createClient>): Promise<string | null> {
  if (hbKeyCache.api_key && Date.now() < hbKeyCache.expiry) return hbKeyCache.api_key;
  const { data } = await sb.from("api_keys").select("id, api_key").eq("service", "hyperbrowser").eq("is_active", true).eq("is_blocked", false).limit(10);
  if (!data || data.length === 0) return null;
  const pick = data[Math.floor(Math.random() * data.length)];
  hbKeyCache.id = pick.id;
  hbKeyCache.api_key = pick.api_key;
  hbKeyCache.expiry = Date.now() + CACHE_TTL_MS;
  return pick.api_key;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function detectComplexity(messages: any[], mode?: string): "simple" | "complex" {
  if (mode === "files") return "complex";
  const lastUser = [...messages].reverse().find((m: any) => m?.role === "user");
  if (!lastUser) return "simple";
  const text = typeof lastUser.content === "string" ? lastUser.content :
    Array.isArray(lastUser.content) ? lastUser.content.map((p: any) => p?.text || "").join(" ") : "";
  const complexPatterns = [
    /\b(code|program|script|function|algorithm|debug|develop|build|create|implement)\b/i,
    /\b(analyze|analysis|compare|explain in detail|research|summarize|translate|write.*report)\b/i,
    /\b(math|equation|calculate|solve|formula|proof)\b/i,
    /```/,
    /\b(step by step|detailed|comprehensive|in-depth)\b/i,
  ];
  if (text.length > 500) return "complex";
  if (complexPatterns.some(p => p.test(text))) return "complex";
  if (messages.length > 10) return "complex";
  return "simple";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, mode, searchEnabled, deepResearch, chatMode, user_id } = await req.json();
    const latestUserMessage = Array.isArray(messages)
      ? [...messages].reverse().find((message: any) => message?.role === "user")
      : null;
    const latestUserText = Array.isArray(latestUserMessage?.content)
      ? latestUserMessage.content.map((part: any) => part?.text || "").join(" ")
      : String(latestUserMessage?.content || "");
    const wantsHamzaProfile = /(hamza|hassan el-gizaery|elgiza|حمزه|حمزة|حمزة حسن)/i.test(latestUserText);
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const SERPER_API_KEY = await getSerperKey(sb);
    const HB_API_KEY = await getHyperbrowserKey(sb);

    // Resolve effective chat mode
    const effectiveMode = chatMode || mode || "normal";
    const isShopping = effectiveMode === "shopping";
    const isLearning = effectiveMode === "learning";

    // ── Fetch user context ──
    let userContext = "";
    if (user_id) {
      try {
        const [profileRes, personalizationRes, memoriesRes, recentConvsRes] = await Promise.all([
          sb.from("profiles").select("display_name, plan, credits").eq("id", user_id).single(),
          sb.from("ai_personalization").select("call_name, about, profession, ai_traits, custom_instructions").eq("user_id", user_id).maybeSingle(),
          sb.from("memories").select("key, value").limit(20),
          sb.from("conversations").select("title, mode").eq("user_id", user_id).order("updated_at", { ascending: false }).limit(10),
        ]);

        const parts: string[] = [];
        if (profileRes.data) {
          const p = profileRes.data;
          parts.push(`User name: ${p.display_name || "Unknown"} (Plan: ${p.plan}, Credits: ${p.credits} MC — only mention if user asks)`);
        }
        if (personalizationRes.data) {
          const ai = personalizationRes.data;
          if (ai.call_name) parts.push(`Call the user: "${ai.call_name}"`);
          if (ai.about) parts.push(`About user: ${ai.about}`);
          if (ai.profession) parts.push(`Profession: ${ai.profession}`);
          if (ai.ai_traits) parts.push(`AI personality: ${ai.ai_traits}`);
          if (ai.custom_instructions) parts.push(`Custom instructions: ${ai.custom_instructions}`);
        }
        if (memoriesRes.data && memoriesRes.data.length > 0) {
          parts.push(`Memories: ${memoriesRes.data.map((m: any) => `${m.key}: ${m.value}`).join("; ")}`);
        }
        if (recentConvsRes.data && recentConvsRes.data.length > 0) {
          parts.push(`Recent conversations: ${recentConvsRes.data.map((c: any) => c.title).join(", ")}`);
        }
        if (parts.length > 0) userContext = `\n\n--- USER CONTEXT ---\n${parts.join("\n")}`;
      } catch { /* silently skip memory errors */ }
    }

    // ── Model routing ──
    const isDeepResearch = deepResearch === true;
    const requestedModel = typeof model === "string" && model !== "auto" ? model : null;
    const isLovableGatewayModel = !!requestedModel && /^(google\/|openai\/)/.test(requestedModel);

    let modelId: string = requestedModel ?? "claude-haiku-4-5";
    let apiUrl = LEMONDATA_URL;
    let apiKey = "";
    let usedKeyId: string | null = null;

    if (isLovableGatewayModel) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "No API keys available" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
    } else {
      const lemonKey = await getLemonDataKey(sb);
      if (lemonKey) {
        apiKey = lemonKey.api_key;
        usedKeyId = lemonKey.id;
      } else {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          return new Response(JSON.stringify({ error: "No API keys available" }), {
            status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
        apiKey = LOVABLE_API_KEY;
        if (!requestedModel) modelId = "google/gemini-2.5-flash";
      }
    }

    // Build Composio tools
    const composioTools = COMPOSIO_API_KEY ? [
      { type: "function", function: { name: "GMAIL_SEND_EMAIL", description: "Send an email using Gmail", parameters: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to", "subject", "body"] } } },
      { type: "function", function: { name: "GMAIL_LIST_EMAILS", description: "List recent emails from Gmail inbox", parameters: { type: "object", properties: { max_results: { type: "number", default: 5 }, query: { type: "string" } } } } },
      { type: "function", function: { name: "GITHUB_CREATE_ISSUE", description: "Create a GitHub issue", parameters: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, body: { type: "string" } }, required: ["owner", "repo", "title"] } } },
      { type: "function", function: { name: "GITHUB_LIST_REPOS", description: "List user's GitHub repositories", parameters: { type: "object", properties: { per_page: { type: "number", default: 10 } } } } },
      { type: "function", function: { name: "SLACK_SEND_MESSAGE", description: "Send a message to a Slack channel", parameters: { type: "object", properties: { channel: { type: "string" }, text: { type: "string" } }, required: ["channel", "text"] } } },
      { type: "function", function: { name: "GOOGLE_CALENDAR_CREATE_EVENT", description: "Create a Google Calendar event", parameters: { type: "object", properties: { title: { type: "string" }, start_time: { type: "string" }, end_time: { type: "string" }, description: { type: "string" } }, required: ["title", "start_time", "end_time"] } } },
      { type: "function", function: { name: "GOOGLE_CALENDAR_LIST_EVENTS", description: "List upcoming Google Calendar events", parameters: { type: "object", properties: { max_results: { type: "number", default: 10 } } } } },
      { type: "function", function: { name: "GOOGLE_DRIVE_LIST_FILES", description: "List files in Google Drive", parameters: { type: "object", properties: { query: { type: "string" }, max_results: { type: "number", default: 10 } } } } },
      { type: "function", function: { name: "NOTION_CREATE_PAGE", description: "Create a page in Notion", parameters: { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, parent_page_id: { type: "string" } }, required: ["title", "content"] } } },
      { type: "function", function: { name: "DISCORD_SEND_MESSAGE", description: "Send a message to a Discord channel", parameters: { type: "object", properties: { channel_id: { type: "string" }, content: { type: "string" } }, required: ["channel_id", "content"] } } },
      { type: "function", function: { name: "LINKEDIN_CREATE_POST", description: "Create a LinkedIn post", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } } },
      { type: "function", function: { name: "YOUTUBE_LIST_VIDEOS", description: "List videos from a YouTube channel", parameters: { type: "object", properties: { query: { type: "string" }, max_results: { type: "number", default: 5 } } } } },
    ] : [];

    // Build search tools
    const searchTools = (((searchEnabled || isDeepResearch) || wantsHamzaProfile) && SERPER_API_KEY) ? [
      {
        type: "function",
        function: {
          name: "WEB_SEARCH",
          description: isDeepResearch
            ? "Perform a comprehensive deep research web search. You MUST call this tool AT LEAST 3-5 TIMES with different queries."
            : "Search the web for current information. Use when the user asks about recent events, facts, product prices, news, or anything that benefits from real-time data.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, include_images: { type: "boolean", description: "Whether to include relevant images" } }, required: ["query"] },
        },
      },
    ] : [];

    // Shopping search tool
    const shoppingTools = (isShopping && SERPER_API_KEY) ? [
      {
        type: "function",
        function: {
          name: "SHOPPING_SEARCH",
          description: "Search for products across online stores. Returns product images, prices, sellers, ratings, and links. ALWAYS use this when the user asks about buying, prices, products, or shopping. You can call it multiple times with different queries to find the best deals.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Product search query" }, num: { type: "number", description: "Number of results (default 10)" } }, required: ["query"] },
        },
      },
      {
        type: "function",
        function: {
          name: "WEB_SEARCH",
          description: "Search the web for product reviews, comparisons, or general information to help the user make better purchasing decisions.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, include_images: { type: "boolean" } }, required: ["query"] },
        },
      },
    ] : [];

    // Browser tool (Computer Use via Hyperbrowser)
    const browserTools = HB_API_KEY ? [
      {
        type: "function",
        function: {
          name: "BROWSE_WEBSITE",
          description: "Open a real browser and autonomously browse a website to extract data, fill forms, or perform actions. Use when: shopping comparisons need live prices, user asks to check a specific website, research needs real-time page content, or any task requiring actual web browsing. Returns extracted content and screenshots.",
          parameters: { type: "object", properties: { goal: { type: "string", description: "What to accomplish (e.g., 'Find the cheapest iPhone 16 on amazon.eg')" }, url: { type: "string", description: "Optional specific URL to start from" } }, required: ["goal"] },
        },
      },
    ] : [];

    // System prompt
    const systemPrompt = buildSystemPrompt(effectiveMode, isDeepResearch, searchEnabled, wantsHamzaProfile, userContext);

    const body: any = {
      model: modelId,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: isDeepResearch ? 4096 : (mode === "files" ? 4096 : 2048),
    };

    const allTools = [...composioTools, ...searchTools, ...shoppingTools, ...browserTools];
    if (allTools.length > 0) {
      body.tools = allTools;
      body.tool_choice = "auto";
    }

    // Key rotation with retry
    let response: Response;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (true) {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (apiUrl === LEMONDATA_URL && (response.status === 401 || response.status === 403 || response.status === 429) && retryCount < MAX_RETRIES) {
        if (response.status !== 429 && usedKeyId) blockLemonKey(sb, usedKeyId, `HTTP ${response.status}`);
        const newKey = await getLemonDataKey(sb, usedKeyId || undefined);
        if (newKey) {
          apiKey = newKey.api_key;
          usedKeyId = newKey.id;
          retryCount++;
          continue;
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          body.model = requestedModel && /^(google\/|openai\/)/.test(requestedModel) ? requestedModel : "google/gemini-2.5-flash";
          const fallbackResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (fallbackResp.ok) {
            return new Response(fallbackResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
          }
          console.error("Lovable AI fallback error:", fallbackResp.status);
        }
      }
      break;
    }

    if (response.ok && usedKeyId) markKeyUsed(sb, usedKeyId);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits depleted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let toolCalls: any[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              if (toolCalls.length > 0) {
                await handleToolCalls(controller, encoder, toolCalls, body, apiUrl, apiKey, modelId, SERPER_API_KEY, COMPOSIO_API_KEY, isDeepResearch, isShopping, searchTools, sb, 0);
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { function: { name: "", arguments: "" } };
                  if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
                continue;
              }

              if (delta.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: delta.content } }] })}\n\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        if (toolCalls.length > 0) {
          await handleToolCalls(controller, encoder, toolCalls, body, apiUrl, apiKey, modelId, SERPER_API_KEY, COMPOSIO_API_KEY, isDeepResearch, isShopping, searchTools, sb, 0);
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Build system prompt ──
function buildSystemPrompt(mode: string | undefined, isDeepResearch: boolean, searchEnabled: boolean | undefined, wantsHamzaProfile: boolean, userContext: string): string {
  if (mode === "files") {
    return `You are Megsy, a smart AI File Agent made by Megsy AI. The current year is 2026. You are a decision-making agent, not a simple chatbot.

CRITICAL RESPONSE RULES:
- Create COMPREHENSIVE, DETAILED, WELL-STRUCTURED documents. NEVER abbreviate or shorten.
- Write FULL paragraphs, complete lists, and detailed explanations.
- If asked for a report, write AT LEAST 2000 words with full sections.
- If asked for a presentation, include AT LEAST 10 detailed slides.
- Use rich formatting: headers (##, ###), bold, bullet points, numbered lists, tables, code blocks.
- Structure your responses with clear sections and sub-sections.

DECISION ENGINE - For every request, internally decide one action:
- analyze_file: Deep analysis of uploaded file content
- answer: Answer questions about file content
- extract: Extract structured data (names, emails, dates, numbers)
- rewrite: Modify content while preserving exact structure and formatting
- generate_document: Create new documents (HTML, structured content)
- ask_user: Ask clarifying questions when request is ambiguous
- auto_review: If user uploads file without clear instructions, automatically provide: Summary, Key Insights, Issues Found, Suggestions
- multi_file_analysis: Compare multiple files, extract differences

Rules:
- When the user attaches images, analyze them carefully and incorporate observations.
- When the user attaches documents/files, read thoroughly and use content.
- If a file is uploaded WITHOUT text, perform auto_review immediately.
- When editing content, keep EXACT same structure and formatting.
- Match the user's language and dialect exactly (Egyptian Arabic → Egyptian Arabic).
- Never use emoji. Never introduce yourself unless asked.
- Vary descriptions and follow-up suggestions.
- Always end with a specific follow-up question.
- When request is ambiguous, use smart questions:
\`\`\`json
{"type":"questions","questions":[{"title":"What format do you need?","options":["Report","Presentation","Summary"],"allowText":true}]}
\`\`\`

IMPORTANT: Before ANY questions JSON block, write a natural sentence explaining what you need.
- For PowerPoint requests, return structured JSON slides.
${userContext}`;
  }
  
  if (isDeepResearch) {
    return `You are Megsy, a Deep Research AI Agent made by Megsy AI. The current year is 2026.

CRITICAL: Never introduce yourself. Never say "I'm Megsy" unless directly asked.

DEEP RESEARCH MODE:
- You MUST use the WEB_SEARCH tool 3-5 TIMES with different focused queries to gather comprehensive information.
- Cover: 1) General overview 2) Latest developments 3) Key data & expert opinions 4) Visual references
- For at least half your searches, set include_images=true.
- While researching people, brands, founders, celebrities, athletes, politicians, or public figures, always gather relevant images too.
- After gathering all information, synthesize into a comprehensive, well-structured research report.

REPORT STRUCTURE:
## Executive Summary
## Key Findings
## Detailed Analysis (with sub-sections)
## Data & Statistics (use tables)
## Expert Opinions
## Counterarguments/Limitations
## Visual Evidence
## Conclusion with Actionable Recommendations
## Sources

- Use markdown extensively: headers, bold, bullet points, numbered lists, tables.
- Cite ALL sources: [Source Name](URL)
- Match the user's language and dialect exactly.
- Aim for 2000-3000+ words in final report.
- Never use emoji.
- End with 3-5 follow-up questions.
${userContext}`;
  }

  // Learning mode
  if (mode === "learning") {
    return `You are Megsy, a smart AI Tutor made by Megsy AI. The current year is 2026.

TEACHING MODE - You are an expert educator and tutor:

TEACHING METHODOLOGY:
1. Start with a simple, relatable analogy or real-world example
2. Break complex topics into small, digestible steps
3. Use the Feynman technique: explain as if to a complete beginner
4. Progress from basic to advanced gradually
5. Check understanding with quick questions after each concept

RESPONSE FORMAT:
- Use clear headers (##) for each concept/section
- Number steps sequentially (Step 1, Step 2...)
- Include practical examples with every concept
- Use analogies and metaphors to make abstract ideas concrete
- Add "💡 Key Insight" callouts for important points
- Include "🤔 Think About It" prompts to encourage deeper thinking
- End with a summary and practice questions

SUBJECT HANDLING:
- Math/Science: Show step-by-step solutions, explain WHY each step works
- Programming: Write code with detailed comments, explain logic flow
- Languages: Use contextual examples, grammar patterns, common mistakes
- History/Social: Tell the story, connect events, explain cause and effect
- General: Use structured breakdown with clear progression

ENGAGEMENT RULES:
- Match the user's language and dialect exactly
- Adapt difficulty based on the user's apparent level
- If the user seems confused, simplify further with a new analogy
- Celebrate correct understanding naturally
- Never skip steps or assume prior knowledge unless stated
- Use tables for comparisons
- Use diagrams described in text when helpful

NEVER:
- Give answers without explanation
- Use jargon without defining it first
- Skip the "why" behind any concept
- Be condescending
- Use emoji excessively
${userContext}`;
  }

  // Shopping mode
  if (mode === "shopping") {
    return `You are Megsy, a smart AI Shopping Assistant made by Megsy AI. The current year is 2026.

SHOPPING ASSISTANT MODE:

YOUR CAPABILITIES:
- You have SHOPPING_SEARCH tool to search across online stores for products with real prices, images, and links
- You have WEB_SEARCH tool for product reviews and comparisons
- ALWAYS use SHOPPING_SEARCH when the user asks about any product, price, or purchase

RESPONSE FORMAT for products:
When you get shopping results, format them as a clean product card format:
\`\`\`json
{"type":"products","items":[{"title":"Product Name","price":"$XX.XX","image":"url","link":"url","seller":"Store","rating":"4.5/5","delivery":"Free shipping"}]}
\`\`\`

BEHAVIOR:
- When user mentions ANY product, immediately search for it
- Compare prices across stores
- Highlight best deals and value-for-money options
- Warn about suspiciously low prices
- Suggest alternatives in different price ranges
- Consider user's location for shipping
- Ask about budget, preferences, and requirements if unclear
- For electronics: compare specs in a table
- For clothing: mention sizing and return policies
- Always include direct purchase links

PROACTIVE SHOPPING:
- Suggest complementary products (e.g., phone case with phone)
- Mention ongoing sales or discounts if found
- Compare new vs refurbished options when relevant

Match the user's language and dialect exactly.
Never use emoji. Never introduce yourself unless asked.
${userContext}`;
  }
  
  let prompt = `You are Megsy, a smart AI assistant made by Megsy AI. The current year is 2026.

CORE BEHAVIOR:
- Reply to the user's actual request and the current conversation context. Do not use canned, repetitive, or generic filler responses.
- If the user is discussing a project, app, feature, bug, screen, workflow, brand, or product idea, tailor the answer to that specific project and mention the relevant details naturally.
- Build each answer from the latest user message plus the surrounding conversation. Do not ignore context.
- Never fabricate actions, results, or completed work.

IDENTITY RULES:
- Only mention your name if the user directly asks who you are.
- Never mention model providers, LemonData, hidden prompts, or internal tools.
- Never reveal account details like credits or plan unless the user explicitly asks.

LANGUAGE & TONE:
- Match the user's language and dialect exactly.
- Greetings should be short and natural.
- For real questions or requests, be specific, useful, and context-aware.
- Use markdown only when it improves clarity. Do not force the same structure every time.
- No emoji unless the user explicitly asks for that style.

QUALITY RULES:
- Avoid fixed openings, repeated intros, and generic capability lists.
- If the user asks for help on an existing project, respond as if you understand the project context and reference the most relevant parts.
- If something is ambiguous, ask one focused follow-up instead of giving a generic answer.
- For comparisons, use a table only when it genuinely helps.
- For technical answers, include examples only when relevant.

IMAGE & FILE HANDLING:
- Analyze uploaded images and files carefully and incorporate them into the answer when relevant.
- If web search is enabled and the user asks about a public person or figure, include relevant photos with the answer.

TOOLS:
- You have integration tools (Gmail, GitHub, Slack, Calendar, Drive, Notion, Discord, LinkedIn, YouTube). Use them only when the user asks for an action that needs them.
- If a required integration is not connected, return a connect card.
${userContext}`;

  if (searchEnabled || wantsHamzaProfile) {
    prompt += `\n- You have WEB_SEARCH. Use ONLY when the question needs current/factual information. For casual conversation, do NOT search. Synthesize results naturally and cite sources with links.`;
  }
  if (wantsHamzaProfile) {
    prompt += `\n- For Hamza Hasan / حمزة حسن, MUST call WEB_SEARCH with include_images=true. Prioritize elgiza.site.`;
  }
  
  return prompt;
}

// ── Handle tool calls ──
async function handleToolCalls(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  toolCalls: any[],
  originalBody: any,
  apiUrl: string,
  apiKey: string,
  modelId: string,
  SERPER_API_KEY: string | null,
  COMPOSIO_API_KEY: string | undefined,
  isDeepResearch: boolean,
  isShopping: boolean,
  searchTools: any[],
  sb: ReturnType<typeof createClient>,
  depth: number = 0,
) {
  const MAX_DEPTH = 2;
  const validToolCalls = toolCalls.filter((tc) => tc?.function?.name);
  const allSearchResults: string[] = [];
  const allImages = new Set<string>();
  const allProducts: any[] = [];
  
  const pushStatus = (status: string) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));
  };
  const shouldIncludeImages = (query: string, explicit: boolean) => {
    if (isDeepResearch || explicit) return true;
    return /(who is|biography|profile|photos|images|picture|person|celebrity|founder|actor|singer|player|president|ممثل|مطرب|لاعب|شخص|شخصية|صور|صورة|مؤسس)/i.test(query);
  };

  for (const tc of validToolCalls) {
    try {
      const toolName = tc.function?.name;
      const toolArgs = safeParseToolArgs(tc.function?.arguments || "{}");

      // Shopping search
      if (toolName === "SHOPPING_SEARCH" && SERPER_API_KEY) {
        const searchQuery = String(toolArgs.query || "").trim();
        if (!searchQuery) continue;

        pushStatus(`يبحث عن منتجات: ${searchQuery}`);

        const shopResp = await fetchWithTimeout("https://google.serper.dev/shopping", {
          method: "POST",
          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ q: searchQuery, num: Number(toolArgs.num) || 10 }),
        }, 10000);

        if (shopResp.ok) {
          const shopData = await shopResp.json();
          if (shopData.shopping?.length) {
            const products = shopData.shopping.map((p: any) => ({
              title: p.title || "",
              price: p.price || "N/A",
              image: p.imageUrl || p.thumbnailUrl || "",
              link: p.link || "",
              seller: p.source || "",
              rating: p.rating ? `${p.rating}/5` : null,
              delivery: p.delivery || null,
            }));
            allProducts.push(...products);

            const context = `Shopping results for "${searchQuery}":\n` + 
              products.map((p: any, i: number) => 
                `[${i+1}] ${p.title} - ${p.price} from ${p.seller}${p.rating ? ` (${p.rating})` : ""}\nLink: ${p.link}`
              ).join("\n\n");
            allSearchResults.push(context);
            
            pushStatus(`تم العثور على ${products.length} منتج`);

            // Send product images
            const productImages = products.filter((p: any) => p.image).map((p: any) => p.image);
            if (productImages.length > 0) {
              productImages.forEach((img: string) => allImages.add(img));
            }
          }
        }
        continue;
      }

      if (toolName === "WEB_SEARCH" && SERPER_API_KEY) {
        const searchQuery = String(toolArgs.query || "").trim();
        if (!searchQuery) continue;

        const includeImages = shouldIncludeImages(searchQuery, Boolean(toolArgs.include_images));
        pushStatus(`يبحث في ${searchQuery}`);

        const searchRequest = fetchWithTimeout("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ q: searchQuery, num: isDeepResearch ? 8 : 6 }),
        }, 8000);

        const imageRequest = includeImages
          ? fetchWithTimeout("https://google.serper.dev/images", {
              method: "POST",
              headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
              body: JSON.stringify({ q: searchQuery, num: isDeepResearch ? 4 : 3 }),
            }, 8000)
          : null;

        const [searchResult, imageResult] = await Promise.allSettled([
          searchRequest,
          ...(imageRequest ? [imageRequest] : []),
        ]);

        if (searchResult.status !== "fulfilled" || !searchResult.value.ok) {
          pushStatus("تعذر البحث، يكمل بالمعلومات المتاحة");
          continue;
        }

        const searchData = await searchResult.value.json();
        const imageData = imageRequest && imageResult?.status === "fulfilled" && imageResult.value.ok
          ? await imageResult.value.json()
          : null;

        let context = `Search: "${searchQuery}"\n`;
        if (searchData.organic?.length) {
          context += searchData.organic.map((r: any, i: number) =>
            `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`
          ).join("\n\n");
        }

        if (searchData.knowledgeGraph) {
          const kg = searchData.knowledgeGraph;
          context = `${kg.title || ""}\n${kg.description || ""}\n\n${context}`;
          if (kg.imageUrl) allImages.add(kg.imageUrl);
        }

        if (imageData?.images) {
          imageData.images.slice(0, isDeepResearch ? 4 : 3).forEach((img: any) => {
            if (img.imageUrl) allImages.add(img.imageUrl);
          });
        }

        const organicCount = searchData.organic?.length || 0;
        pushStatus(organicCount > 0 ? `تم العثور على ${organicCount} نتائج` : "تم البحث");
        allSearchResults.push(context);
        continue;
      }

      if (!COMPOSIO_API_KEY || !toolName) continue;

      const connResp = await fetch(`${COMPOSIO_BASE}/connectedAccounts?user_uuid=default`, {
        headers: { "x-api-key": COMPOSIO_API_KEY, "Content-Type": "application/json" },
      });
      const connData = await connResp.json();
      const accounts = connData.items || connData || [];

      const appName = toolName.split("_")[0].toLowerCase();
      const account = accounts.find((a: any) =>
        (a.appName || "").toLowerCase().includes(appName) ||
        (a.appUniqueId || "").toLowerCase().includes(appName)
      );

      if (!account) {
        const serviceName = toolName.split("_")[0];
        const connectCard = `\n\n\`\`\`json\n{"type":"cards","items":[{"title":"Connect ${serviceName}","description":"Requires connecting your ${serviceName} account first","action":"Connect"}]}\n\`\`\``;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: connectCard } }] })}\n\n`));
        continue;
      }

      const execResp = await fetch(`${COMPOSIO_BASE}/actions/${encodeURIComponent(toolName)}/execute`, {
        method: "POST",
        headers: { "x-api-key": COMPOSIO_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ connectedAccountId: account.id, input: toolArgs }),
      });
      const execData = await execResp.json();

      const resultText = execResp.ok
        ? `\n\n---\n**${toolName}** executed successfully.\n\`\`\`json\n${JSON.stringify(execData.data || execData, null, 2).slice(0, 1500)}\n\`\`\``
        : `\n\n---\n**${toolName}** failed: ${JSON.stringify(execData).slice(0, 500)}`;

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: resultText } }] })}\n\n`));
    } catch (toolErr) {
      console.error("Tool execution error:", toolErr);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "\n\nحدث خطأ أثناء تنفيذ الأداة. سأكمل بما توفر لدي." } }] })}\n\n`));
    }
  }

  if (allSearchResults.length > 0) {
    const images = Array.from(allImages);
    if (images.length > 0) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ images })}\n\n`));
    }

    // Send products data
    if (allProducts.length > 0) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: allProducts })}\n\n`));
    }

    pushStatus(isDeepResearch ? "يكتب التقرير الآن" : (isShopping ? "يحلل المنتجات ويكتب التوصيات" : "يكتب الرد الآن"));
    const combinedContext = allSearchResults.join("\n\n=== Next Search ===\n\n");

    const searchMessages = [
      ...originalBody.messages,
      { role: "assistant", content: "I searched and found the following information. Let me synthesize this into a comprehensive response." },
      { role: "user", content: `Here are the search results:\n\n${combinedContext}\n\n${isShopping 
        ? "Format the products nicely with prices, sellers, ratings, and purchase links. Compare options and give clear recommendations. Use tables for comparisons." 
        : isDeepResearch 
          ? "Write a detailed research report with sections: Executive Summary, Key Findings, Detailed Analysis, Data & Statistics, Conclusion with Recommendations, and Sources." 
          : "Synthesize the information naturally and cite sources with [Source Name](URL)."}` },
    ];

    const secondBody: any = {
      model: "claude-haiku-4-5",
      messages: searchMessages,
      stream: true,
      max_tokens: isDeepResearch ? 3072 : 1536,
    };

    try {
      const secondResp = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(secondBody),
      });

      if (secondResp.ok && secondResp.body) {
        const secondReader = secondResp.body.getReader();
        const decoder = new TextDecoder();
        let buf2 = "";

        while (true) {
          const { done: d2, value: v2 } = await secondReader.read();
          if (d2) break;
          buf2 += decoder.decode(v2, { stream: true });
          const lines2 = buf2.split("\n");
          buf2 = lines2.pop() || "";

          for (const l2 of lines2) {
            if (!l2.startsWith("data: ")) continue;
            const d = l2.slice(6).trim();
            if (d === "[DONE]") continue;

            try {
              const p = JSON.parse(d);
              const delta2 = p.choices?.[0]?.delta;
              if (!delta2) continue;

              // Ignore nested tool calls in synthesis - prevents infinite loops
              if (delta2.tool_calls) continue;

              const c = delta2.content;
              if (c) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`));
            } catch {
              continue;
            }
          }
        }
      } else {
        console.error("Synthesis call failed:", secondResp.status);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "\n\n" + combinedContext.slice(0, 3000) } }] })}\n\n`));
      }
    } catch (e) {
      console.error("Synthesis error:", e);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "\n\nتعذر تجميع النتائج:\n\n" + combinedContext.slice(0, 2000) } }] })}\n\n`));
    }
  }
}
