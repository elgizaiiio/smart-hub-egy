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

// ── LemonData key cache ──
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

// Serper key from api_keys table
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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Complexity detection for model routing ──
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

    // ── Get Serper key ──
    const SERPER_API_KEY = await getSerperKey(sb);

    // ── Fetch user context for memory system ──
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

    // ── Model routing: ALL through LemonData ──
    const complexity = detectComplexity(messages, mode);
    const isDeepResearch = deepResearch === true;

    // Model selection via LemonData
    let modelId: string;
    if (model && model !== "auto") {
      modelId = model;
    } else if (isDeepResearch) {
      modelId = "deepseek-v3-2";
    } else {
      modelId = "claude-haiku-4-5";
    }

    // Get LemonData key
    const lemonKey = await getLemonDataKey(sb);
    if (!lemonKey) {
      // Fallback to LOVABLE_API_KEY
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "No API keys available" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Use Lovable AI gateway as fallback
      const apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      modelId = "google/gemini-3-flash-preview";
      
      // Build system prompt and body, then make request
      const systemPrompt = buildSystemPrompt(mode, isDeepResearch, searchEnabled, wantsHamzaProfile, userContext);
      const body: any = {
        model: modelId,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        max_tokens: isDeepResearch ? 8192 : (mode === "files" ? 8192 : 4096),
      };
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const t = await response.text();
        console.error("Lovable AI fallback error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    let apiKey = lemonKey.api_key;
    let usedKeyId = lemonKey.id;

    // Build Composio tools for function calling
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

    // Build search tool
    const searchTools = (((searchEnabled || isDeepResearch) || wantsHamzaProfile) && SERPER_API_KEY) ? [
      {
        type: "function",
        function: {
          name: "WEB_SEARCH",
          description: isDeepResearch
            ? "Perform a comprehensive deep research web search. You MUST call this tool AT LEAST 6-10 TIMES with different queries to gather exhaustive information from every possible angle."
            : "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, product prices, news, weather, or anything that benefits from real-time data.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, include_images: { type: "boolean", description: "Whether to include relevant images in results" } }, required: ["query"] },
        },
      },
    ] : [];

    // System prompt
    const systemPrompt = buildSystemPrompt(mode, isDeepResearch, searchEnabled, wantsHamzaProfile, userContext);

    const body: any = {
      model: modelId,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: isDeepResearch ? 8192 : (mode === "files" ? 8192 : 4096),
    };

    const allTools = [...composioTools, ...searchTools];
    if (allTools.length > 0) {
      body.tools = allTools;
      body.tool_choice = "auto";
    }

    // Key rotation with retry
    let response: Response;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (true) {
      response = await fetch(LEMONDATA_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if ((response.status === 401 || response.status === 403 || response.status === 429) && retryCount < MAX_RETRIES) {
        if (response.status !== 429) blockLemonKey(sb, usedKeyId, `HTTP ${response.status}`);
        const newKey = await getLemonDataKey(sb, usedKeyId);
        if (newKey) {
          apiKey = newKey.api_key;
          usedKeyId = newKey.id;
          retryCount++;
          continue;
        }
        // Fallback to Lovable AI
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          body.model = "google/gemini-3-flash-preview";
          const fallbackResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (fallbackResp.ok) {
            return new Response(fallbackResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
          }
        }
      }
      break;
    }

    // Mark key as used on success
    if (response.ok) markKeyUsed(sb, usedKeyId);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
              // Handle tool calls
              if (toolCalls.length > 0) {
                await handleToolCalls(controller, encoder, toolCalls, body, LEMONDATA_URL, apiKey, modelId, SERPER_API_KEY, COMPOSIO_API_KEY, isDeepResearch, searchTools, sb);
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              // Accumulate tool calls
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { function: { name: "", arguments: "" } };
                  if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
                continue;
              }

              // Forward content
              if (delta.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: delta.content } }] })}\n\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Handle remaining tool calls
        if (toolCalls.length > 0) {
          await handleToolCalls(controller, encoder, toolCalls, body, LEMONDATA_URL, apiKey, modelId, SERPER_API_KEY, COMPOSIO_API_KEY, isDeepResearch, searchTools, sb);
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
- You MUST use the WEB_SEARCH tool AT LEAST 6-10 TIMES with different queries.
- Divide research into: 1) General overview 2) Latest developments 3) Expert opinions 4) Data & statistics 5) Case studies 6) Counterarguments 7) Future outlook 8) Visual references
- For at least half your searches, set include_images=true.
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
  
  let prompt = `You are Megsy, a smart AI assistant made by Megsy AI. The current year is 2026.

IDENTITY RULES:
- Your name is Megsy. Only state this if directly asked who you are.
- NEVER introduce yourself or say "I'm Megsy" unprompted. Just respond naturally.
- Never mention Google, Gemini, DeepSeek, GLM, LemonData or any AI company.
- NEVER share user's account info (credits, plan, etc.) unless EXPLICITLY asked about it.

CONVERSATION RULES (CRITICAL):
- For casual greetings (hi, ازيك, مرحبا, etc.): respond WARMLY and BRIEFLY like a friend. Just say hi back naturally. Do NOT mention credits, plan, features, or capabilities.
- For questions: provide comprehensive answers with context, examples, and nuance.
- For tasks: break down into clear steps with explanations.
- Use markdown formatting: ## headers, **bold**, \`code\`, bullet points, numbered lists, tables.
- Structure long responses with clear sections and sub-headers.
- Include relevant examples, analogies, and practical applications.
- When comparing things, use tables for clarity.
- For technical topics, include code examples when helpful.

LANGUAGE & TONE:
- ALWAYS match the user's language AND dialect exactly. Egyptian Arabic → Egyptian Arabic. Khaleeji → Khaleeji. English → English.
- Adapt response LENGTH: greetings → 1-2 warm sentences ONLY, questions → detailed explanations, complex topics → comprehensive analysis.
- Detect expertise level: beginners get simpler explanations, experts get concise technical answers.
- Match the user's mood naturally. Never use emoji.
- When the user greets casually, respond warmly and briefly like a friend. Example: "ازيك" → "الحمدلله بخير، وانت عامل ايه؟" NOT a list of features.
- End with a brief, natural follow-up question ONLY for substantive topics, NOT for greetings.

IMAGE & FILE HANDLING:
- Analyze images carefully and provide relevant insights.
- Read files thoroughly and respond based on content.
- Use WEB_SEARCH proactively when topics benefit from current data.

SMART OUTPUT ROUTING:

1. For ambiguous requests (write a natural intro in user's language before JSON):
\`\`\`json
{"type":"questions","questions":[{"title":"Question?","options":["A","B","C"],"allowText":true}]}
\`\`\`

2. For plans/workflows:
\`\`\`json
{"type":"flow","steps":[{"title":"Step 1","description":"Description","actions":["Execute"]}]}
\`\`\`

3. For suggestions (add "Click on any card below:" before JSON):
\`\`\`json
{"type":"cards","items":[{"title":"Idea","description":"Description","action":"Learn more"}]}
\`\`\`

4. For SHOPPING: Info Cards with image and link fields.

5. For unconnected integrations:
\`\`\`json
{"type":"cards","items":[{"title":"Connect Service","description":"Requires connecting your account","action":"Connect"}]}
\`\`\`

6. Comparisons → tables. Code → code blocks. Simple answers → plain text.

- You have integration tools (Gmail, GitHub, Slack, Calendar, Drive, Notion, Discord, LinkedIn, YouTube). Use the appropriate tool when asked. If not connected, output a Connect card.
${userContext}`;

  if (searchEnabled || wantsHamzaProfile) {
    prompt += `\n- You have WEB_SEARCH. Use ONLY when the question needs current/factual information. For casual conversation, do NOT search. Synthesize results naturally and cite sources with links.`;
  }
  if (wantsHamzaProfile) {
    prompt += `\n- For Hamza Hasan / حمزة حسن, MUST call WEB_SEARCH with include_images=true. Prioritize elgiza.site.`;
  }
  
  return prompt;
}

// ── Handle tool calls (search, composio) ──
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
  searchTools: any[],
  sb: ReturnType<typeof createClient>,
) {
  const allSearchResults: string[] = [];
  const allImages: string[] = [];

  for (const tc of toolCalls) {
    try {
      const toolName = tc.function?.name;
      const toolArgs = safeParseToolArgs(tc.function?.arguments || "{}");

      if (toolName === "WEB_SEARCH" && SERPER_API_KEY) {
        const searchQuery = toolArgs.query || "";
        const includeImages = isDeepResearch ? true : (toolArgs.include_images ?? false);
        
        const fetches: Promise<Response>[] = [
          fetchWithTimeout("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ q: searchQuery, num: isDeepResearch ? 10 : 8 }),
          }, 10000),
        ];
        if (includeImages) {
          fetches.push(fetchWithTimeout("https://google.serper.dev/images", {
            method: "POST",
            headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ q: searchQuery, num: isDeepResearch ? 6 : 4 }),
          }, 10000));
        }

        const responses = await Promise.all(fetches);
        const searchData = await responses[0].json();
        const imageData = includeImages && responses[1] ? await responses[1].json() : null;

        let context = `Search: "${searchQuery}"\n`;
        if (searchData.organic) {
          context += searchData.organic.map((r: any, i: number) =>
            `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`
          ).join("\n\n");
        }
        if (searchData.knowledgeGraph) {
          const kg = searchData.knowledgeGraph;
          context = `${kg.title || ""}\n${kg.description || ""}\n\n${context}`;
          if (kg.imageUrl) allImages.push(kg.imageUrl);
        }
        if (imageData?.images) {
          imageData.images.slice(0, isDeepResearch ? 6 : 4).forEach((img: any) => {
            if (img.imageUrl) allImages.push(img.imageUrl);
          });
        }
        allSearchResults.push(context);
        continue;
      }

      // Handle Composio tools
      if (!COMPOSIO_API_KEY) continue;
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
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\nTool error: ${toolErr}` } }] })}\n\n`));
    }
  }

  // If we have search results, make a second AI call
  if (allSearchResults.length > 0) {
    // Send images first if any
    if (allImages.length > 0) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ images: allImages })}\n\n`));
    }

    const combinedContext = allSearchResults.join("\n\n=== Next Search ===\n\n");
    const searchMessages = [
      ...originalBody.messages,
      {
        role: "assistant",
        content: null,
        tool_calls: toolCalls
          .filter(tc => tc.function?.name === "WEB_SEARCH")
          .map((tc, i) => ({
            id: `search_${i}`,
            type: "function",
            function: { name: "WEB_SEARCH", arguments: tc.function.arguments }
          })),
      },
      ...toolCalls
        .filter(tc => tc.function?.name === "WEB_SEARCH")
        .map((tc, i) => ({
          role: "tool",
          tool_call_id: `search_${i}`,
          content: allSearchResults[i] || "No results found.",
        })),
    ];

    const secondBody: any = { model: modelId, messages: searchMessages, stream: true, max_tokens: isDeepResearch ? 8192 : 4096 };
    if (isDeepResearch && searchTools.length > 0) {
      secondBody.tools = searchTools;
      secondBody.tool_choice = "auto";
    }

    const secondResp = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(secondBody),
    });

    if (secondResp.ok && secondResp.body) {
      const secondReader = secondResp.body.getReader();
      const decoder = new TextDecoder();
      let buf2 = "";
      let secondToolCalls: any[] = [];

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
            // Accumulate recursive tool calls (deep research does multiple searches)
            if (delta2.tool_calls) {
              for (const tc of delta2.tool_calls) {
                const idx = tc.index ?? 0;
                if (!secondToolCalls[idx]) secondToolCalls[idx] = { function: { name: "", arguments: "" } };
                if (tc.function?.name) secondToolCalls[idx].function.name = tc.function.name;
                if (tc.function?.arguments) secondToolCalls[idx].function.arguments += tc.function.arguments;
              }
              continue;
            }
            const c = delta2.content;
            if (c) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`));
          } catch { /* skip */ }
        }
      }
      // Handle recursive tool calls from deep research (up to 2 more rounds)
      if (secondToolCalls.length > 0 && isDeepResearch) {
        await handleToolCalls(controller, encoder, secondToolCalls, { ...originalBody, messages: searchMessages }, apiUrl, apiKey, modelId, SERPER_API_KEY, COMPOSIO_API_KEY, isDeepResearch, searchTools, sb);
      }
    }
  }
}
