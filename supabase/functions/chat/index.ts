import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";
const LEMONDATA_URL = "https://api.lemondata.cc/v1/chat/completions";

// ── Smart Key Cache: in-memory sticky key to avoid DB queries on every request ──
let cachedKey: { id: string; api_key: string } | null = null;
let cachedKeyExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getLemonDataKey(sb: ReturnType<typeof createClient>, excludeId?: string): Promise<{ id: string; api_key: string } | null> {
  // Return cached key if still valid and not excluded
  if (cachedKey && Date.now() < cachedKeyExpiry && cachedKey.id !== excludeId) {
    return cachedKey;
  }
  const { data } = await sb.from("lemondata_keys")
    .select("id, api_key")
    .eq("is_active", true)
    .eq("is_blocked", false)
    .limit(50);
  if (!data || data.length === 0) { cachedKey = null; return null; }
  // Filter out excluded key
  const pool = excludeId ? data.filter((k: any) => k.id !== excludeId) : data;
  if (pool.length === 0) { cachedKey = null; return null; }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  cachedKey = pick;
  cachedKeyExpiry = Date.now() + CACHE_TTL_MS;
  return pick;
}

// Block key - fire and forget, also invalidate cache
function blockLemonKey(sb: ReturnType<typeof createClient>, keyId: string, reason: string) {
  if (cachedKey?.id === keyId) { cachedKey = null; }
  // Fire and forget - don't await
  sb.from("lemondata_keys").update({
    is_blocked: true,
    block_reason: reason,
    last_error_at: new Date().toISOString(),
  }).eq("id", keyId).then(() => {
    sb.from("lemondata_keys").select("error_count").eq("id", keyId).single().then(({ data }) => {
      if (data) sb.from("lemondata_keys").update({ error_count: (data.error_count || 0) + 1 }).eq("id", keyId);
    });
  });
}

// Mark key as used - fire and forget
function markKeyUsed(sb: ReturnType<typeof createClient>, keyId: string) {
  sb.from("lemondata_keys").select("usage_count").eq("id", keyId).single().then(({ data }) => {
    sb.from("lemondata_keys").update({
      last_used_at: new Date().toISOString(),
      usage_count: ((data?.usage_count) || 0) + 1,
    }).eq("id", keyId);
  });
}

// Helper: fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Fetch user context for memory system ──
    let userContext = "";
    if (user_id) {
      try {
        const [profileRes, personalizationRes, memoriesRes, recentConvsRes] = await Promise.all([
          sb.from("profiles").select("display_name, plan, credits").eq("id", user_id).single(),
          sb.from("ai_personalization").select("call_name, about, profession, ai_traits, custom_instructions").eq("user_id", user_id).maybeSingle(),
          sb.from("memories").select("key, value").limit(20),
          sb.from("conversations").select("title").eq("user_id", user_id).order("updated_at", { ascending: false }).limit(5),
        ]);

        const parts: string[] = [];
        if (profileRes.data) {
          const p = profileRes.data;
          parts.push(`User: ${p.display_name || "Unknown"}, Plan: ${p.plan}, Credits: ${p.credits} MC`);
        }
        if (personalizationRes.data) {
          const ai = personalizationRes.data;
          if (ai.call_name) parts.push(`Call the user: "${ai.call_name}"`);
          if (ai.about) parts.push(`About user: ${ai.about}`);
          if (ai.profession) parts.push(`Profession: ${ai.profession}`);
          if (ai.ai_traits) parts.push(`AI personality traits: ${ai.ai_traits}`);
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

    let apiUrl: string;
    let apiKey: string;
    let modelId: string;
    let usedKeyId: string | null = null;

    const lovableModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview"];
    const requestedModel = model || "gemini-3.1-flash-preview";

    if (lovableModels.some(m => requestedModel.includes(m))) {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      modelId = requestedModel.startsWith("google/") ? requestedModel : `google/${requestedModel}`;
    } else {
      // Use LemonData with smart cached key
      const lemonKey = await getLemonDataKey(sb);

      if (!lemonKey) {
        // Fallback: try OpenRouter if no LemonData keys available
        const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
        if (!OPENROUTER_API_KEY) {
          return new Response(JSON.stringify({ error: "No API keys available" }), {
            status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = OPENROUTER_API_KEY;
      } else {
        apiUrl = LEMONDATA_URL;
        apiKey = lemonKey.api_key;
        usedKeyId = lemonKey.id;
      }
      modelId = requestedModel;
    }
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
    const isDeepResearch = deepResearch === true;
    const searchTools = (((searchEnabled || isDeepResearch) || wantsHamzaProfile) && SERPER_API_KEY) ? [
      {
        type: "function",
        function: {
          name: "WEB_SEARCH",
          description: isDeepResearch
            ? "Perform a comprehensive deep research web search. You MUST call this tool AT LEAST 6-10 TIMES with different queries to gather exhaustive information from every possible angle. Divide your research into sub-tasks: overview, latest news, expert analysis, data/statistics, case studies, counterarguments, future outlook, and related images. Always set include_images=true for at least half your searches."
            : "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, product prices, news, weather, or anything that benefits from real-time data. Do NOT search for casual greetings or simple conversational messages.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, include_images: { type: "boolean", description: "Whether to include relevant images in results. Always true for deep research." } }, required: ["query"] },
        },
      },
    ] : [];

    // System prompt
    let systemPrompt: string;
    if (mode === "files") {
      systemPrompt = `You are Megsy, a smart AI File Agent made by Megsy AI. The current year is 2026. You are a decision-making agent, not a simple chatbot.

DECISION ENGINE - For every request, internally decide one action:
- analyze_file: Deep analysis of uploaded file content
- answer: Answer questions about file content
- extract: Extract structured data (names, emails, dates, numbers)
- rewrite: Modify content while preserving exact structure and formatting
- generate_document: Create new documents (HTML, structured content)
- ask_user: Ask clarifying questions when request is ambiguous
- auto_review: If user uploads file without clear instructions, automatically provide: Summary, Key Insights, Issues Found, Suggestions
- multi_file_analysis: Compare multiple files, extract differences
- external_connection_required: When external access (Google Drive, etc.) is needed

Rules:
- Create comprehensive, detailed, well-structured documents.
- When asked to generate HTML documents, make them professional, thorough, and visually polished with proper CSS styling.
- Include ALL relevant sections, details, and content. Do NOT abbreviate or shorten anything.
- Write FULL paragraphs, complete lists, and detailed explanations.
- If the user asks for a report, write at least 2000 words. If a presentation, include at least 10 detailed slides.
- When the user attaches images, analyze them carefully and incorporate your observations into the document.
- When the user attaches documents/files, read the content thoroughly and use it in your response.
- If a file is uploaded WITHOUT any text message, perform auto_review immediately.
- When editing content, keep EXACT same structure and formatting. ONLY replace text. Do NOT change layout.
- Match the user's language and dialect exactly.
- Never use emoji.
- Vary your descriptions and follow-up suggestions. Never repeat the same phrases.
- Always end with a specific follow-up question related to what was created.
- If web search is enabled, use it to find real data, statistics, and references for the document.
- When request is ambiguous, use smart questions:
\`\`\`json
{"type":"questions","questions":[{"title":"What format do you need?","options":["Report","Presentation","Summary"],"allowText":true}]}
\`\`\`
IMPORTANT: Before ANY questions JSON block, write a natural sentence in the user's language explaining what you need from them. Never use a fixed English phrase. Write it naturally as part of your response.
- If external access is needed, output a Connect card:
\`\`\`json
{"type":"cards","items":[{"title":"Connect Google Drive","description":"This action requires connecting your Google Drive","action":"Connect"}]}
\`\`\`
- For PowerPoint requests, return structured JSON slides.`;
    } else if (isDeepResearch) {
      const isMegsyModel = requestedModel.includes("gemini-3-flash");
      const identityLine = isMegsyModel
        ? "- Your name is Megsy. You were created by Megsy AI company. Never mention Google, Gemini, or any other company as your creator."
        : "";
      systemPrompt = `You are Megsy, a Deep Research AI Agent made by Megsy AI. The current year is 2026. Rules:
${identityLine}
- You are in DEEP RESEARCH mode. Your job is to conduct the most thorough, exhaustive research possible on the user's topic.
- You MUST use the WEB_SEARCH tool AT LEAST 6-10 TIMES with different queries to gather information from every possible angle.
- Divide your research into sub-tasks: 1) General overview 2) Latest developments 3) Expert opinions 4) Data & statistics 5) Case studies 6) Counterarguments 7) Future outlook 8) Visual references
- For at least half your searches, set include_images=true to gather relevant images.
- After gathering all information, synthesize it into a comprehensive, well-structured research report.
- Your report should include: Executive Summary, Key Findings, Detailed Analysis with sub-sections, Data & Statistics (use tables), Expert Opinions, Counterarguments/Limitations, Visual Evidence (reference the images), and Conclusion with Actionable Recommendations.
- Use markdown formatting extensively: headers (##, ###), bold, bullet points, numbered lists, and tables where appropriate.
- Cite ALL sources with links in the format [Source Name](URL).
- Match the user's language and dialect exactly.
- Be extremely thorough - aim for at least 2000-3000 words in your final report.
- Include relevant images when available by using the include_images parameter in your searches.
- Never use emoji.
- Always end with 3-5 follow-up questions for deeper exploration.`;
    } else {
      systemPrompt = `You are Megsy, a smart AI assistant made by Megsy AI. The current year is 2026.

IDENTITY RULES:
- Your name is Megsy, created by Megsy AI. Only state this if the user directly asks who you are. Never mention Google, Gemini, or any other company.
- NEVER introduce yourself or say "I'm Megsy" unprompted. Just respond naturally to whatever the user says.

LANGUAGE & TONE:
- ALWAYS match the user's language AND dialect exactly. Egyptian Arabic → Egyptian Arabic. Khaleeji → Khaleeji. English → English.
- Adapt response LENGTH: greetings → 1-3 warm sentences, complex topics → detailed explanations with examples.
- Detect expertise level: beginners get simpler explanations, experts get concise technical answers.
- Match the user's mood naturally. Never use emoji.
- Use markdown formatting: headers, bold, code blocks, bullet points, tables.
- When the user greets casually, respond warmly and briefly without introducing yourself.
- Always end with a brief, natural follow-up question.

IMAGE & FILE HANDLING:
- Analyze images carefully and provide relevant insights.
- Read files thoroughly and respond based on content.
- Use WEB_SEARCH proactively when topics benefit from current data.

SMART OUTPUT ROUTING:

1. For ambiguous requests, ask clarifying questions (write a natural intro in user's language before JSON):
\`\`\`json
{"type":"questions","questions":[{"title":"Question?","options":["A","B","C"],"allowText":true}]}
\`\`\`

2. For plans/workflows:
\`\`\`json
{"type":"flow","steps":[{"title":"Step 1","description":"Description","actions":["Execute"]}]}
\`\`\`

3. For suggestions/options (add "Click on any card below:" before JSON):
\`\`\`json
{"type":"cards","items":[{"title":"Idea","description":"Description","action":"Learn more"}]}
\`\`\`

4. For SHOPPING: Info Cards with image and link fields.

5. For unconnected integrations:
\`\`\`json
{"type":"cards","items":[{"title":"Connect Service","description":"Requires connecting your account","action":"Connect"}]}
\`\`\`

6. Comparisons → tables. Code → code blocks. Simple answers → plain text.

- You have access to integration tools (Gmail, GitHub, Slack, Calendar, Drive, Notion, Discord, LinkedIn, YouTube). Use the appropriate tool when asked. If not connected, output a Connect card.
${userContext}`;
      if (searchEnabled || wantsHamzaProfile) {
        systemPrompt += `\n- You have WEB_SEARCH. Use ONLY when the question needs current/factual information. For casual conversation, do NOT search. Synthesize results naturally and cite sources.`;
      }
      if (wantsHamzaProfile) {
        systemPrompt += `\n- For Hamza Hasan / حمزة حسن, MUST call WEB_SEARCH with include_images=true. Prioritize elgiza.site.`;
      }
    }

    const body: any = {
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    const allTools = [...composioTools, ...searchTools];
    if (allTools.length > 0) {
      body.tools = allTools;
      body.tool_choice = "auto";
    }

    // LemonData key rotation: retry with different keys on auth failures
    let response: Response;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (true) {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://megsyai.com", "X-Title": "Megsy" } : {}),
        },
        body: JSON.stringify(body),
      });

      // If LemonData key failed with auth error, block and retry with new key
      if ((response.status === 401 || response.status === 403) && apiUrl === LEMONDATA_URL && usedKeyId && retryCount < MAX_RETRIES) {
        console.error(`LemonData key ${usedKeyId} failed with ${response.status}, blocking...`);
        blockLemonKey(sb, usedKeyId, `HTTP ${response.status}`); // fire-and-forget
        const newKey = await getLemonDataKey(sb, usedKeyId);
        if (newKey) {
          apiKey = newKey.api_key;
          usedKeyId = newKey.id;
          retryCount++;
          continue;
        }
        // No more LemonData keys — fallback to OpenRouter
        const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
        if (OPENROUTER_API_KEY) {
          console.log("All LemonData keys exhausted, falling back to OpenRouter");
          apiUrl = "https://openrouter.ai/api/v1/chat/completions";
          apiKey = OPENROUTER_API_KEY;
          usedKeyId = null;
          retryCount++;
          continue;
        }
      }
      // If rate limited on LemonData, try another key immediately
      if (response.status === 429 && apiUrl === LEMONDATA_URL && usedKeyId && retryCount < MAX_RETRIES) {
        const newKey = await getLemonDataKey(sb, usedKeyId);
        if (newKey) {
          apiKey = newKey.api_key;
          usedKeyId = newKey.id;
          retryCount++;
          continue;
        }
      }
      break;
    }

    // Mark key as used on success
    if (usedKeyId && response.ok) {
      markKeyUsed(sb, usedKeyId); // fire and forget
    }

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
              // If we have tool calls, execute them
              if (toolCalls.length > 0) {
                const allSearchResults: string[] = [];
                const allImages: string[] = [];

                for (const tc of toolCalls) {
                  try {
                    const toolName = tc.function?.name;
                    const toolArgs = JSON.parse(tc.function?.arguments || "{}");

                    if (toolName === "WEB_SEARCH" && SERPER_API_KEY) {
                      const searchQuery = toolArgs.query || "";
                      // For deep research, always include images
                      const includeImages = isDeepResearch ? true : (toolArgs.include_images ?? false);
                      
                      const fetches: Promise<Response>[] = [
                        fetch("https://google.serper.dev/search", {
                          method: "POST",
                          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                          body: JSON.stringify({ q: searchQuery, num: isDeepResearch ? 10 : 8 }),
                        }),
                      ];
                      if (includeImages) {
                        fetches.push(fetch("https://google.serper.dev/images", {
                          method: "POST",
                          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                          body: JSON.stringify({ q: searchQuery, num: isDeepResearch ? 6 : 4 }),
                        }));
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
                      // Output a connect card instead of plain text
                      const serviceName = toolName.split("_")[0];
                      const connectCard = `\n\n\`\`\`json\n{"type":"cards","items":[{"title":"Connect ${serviceName}","description":"This action requires connecting your ${serviceName} account first","action":"Connect"}]}\n\`\`\``;
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

                // If we have search results, make a second AI call with ALL results combined
                if (allSearchResults.length > 0) {
                  const combinedContext = allSearchResults.join("\n\n=== Next Search ===\n\n");

                  const searchMessages = [
                    ...body.messages,
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

                  const secondBody: any = { model: modelId, messages: searchMessages, stream: true };
                  // For deep research, allow more tool calls in second pass
                  if (isDeepResearch && SERPER_API_KEY) {
                    secondBody.tools = searchTools;
                    secondBody.tool_choice = "auto";
                  }

                  const secondResp = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      "Content-Type": "application/json",
                      ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://megsyai.com", "X-Title": "Megsy" } : {}),
                    },
                    body: JSON.stringify(secondBody),
                  });

                  if (secondResp.ok && secondResp.body) {
                    const secondReader = secondResp.body.getReader();
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
                        if (d === "[DONE]") {
                          // Handle additional tool calls from second response (deep research continuation)
                          if (secondToolCalls.length > 0) {
                            const moreResults: string[] = [];
                            const moreImages: string[] = [];
                            for (const stc of secondToolCalls) {
                              try {
                                const sToolName = stc.function?.name;
                                const sToolArgs = JSON.parse(stc.function?.arguments || "{}");
                                if (sToolName === "WEB_SEARCH" && SERPER_API_KEY) {
                                  const includeImgs = isDeepResearch ? true : (sToolArgs.include_images ?? false);
                                  const fetches2: Promise<Response>[] = [
                                    fetch("https://google.serper.dev/search", {
                                      method: "POST",
                                      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                                      body: JSON.stringify({ q: sToolArgs.query || "", num: 8 }),
                                    }),
                                  ];
                                  if (includeImgs) {
                                    fetches2.push(fetch("https://google.serper.dev/images", {
                                      method: "POST",
                                      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                                      body: JSON.stringify({ q: sToolArgs.query || "", num: 4 }),
                                    }));
                                  }
                                  const resps2 = await Promise.all(fetches2);
                                  const sd = await resps2[0].json();
                                  const id2 = includeImgs && resps2[1] ? await resps2[1].json() : null;
                                  let ctx = `Search: "${sToolArgs.query}"\n`;
                                  if (sd.organic) {
                                    ctx += sd.organic.map((r: any, i: number) => `[${i+1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`).join("\n\n");
                                  }
                                  if (id2?.images) {
                                    id2.images.slice(0, 4).forEach((img: any) => {
                                      if (img.imageUrl) moreImages.push(img.imageUrl);
                                    });
                                  }
                                  moreResults.push(ctx);
                                }
                              } catch {}
                            }

                            if (moreResults.length > 0) {
                              allImages.push(...moreImages);
                              const thirdMessages = [
                                ...searchMessages,
                                {
                                  role: "assistant",
                                  content: null,
                                  tool_calls: secondToolCalls.map((stc, i) => ({
                                    id: `search_extra_${i}`,
                                    type: "function",
                                    function: { name: "WEB_SEARCH", arguments: stc.function.arguments }
                                  })),
                                },
                                ...secondToolCalls.map((stc, i) => ({
                                  role: "tool",
                                  tool_call_id: `search_extra_${i}`,
                                  content: moreResults[i] || "No results.",
                                })),
                              ];
                              const thirdResp = await fetch(apiUrl, {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${apiKey}`,
                                  "Content-Type": "application/json",
                                  ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://megsyai.com", "X-Title": "Megsy" } : {}),
                                },
                                body: JSON.stringify({ model: modelId, messages: thirdMessages, stream: true }),
                              });
                              if (thirdResp.ok && thirdResp.body) {
                                const thirdReader = thirdResp.body.getReader();
                                let buf3 = "";
                                while (true) {
                                  const { done: d3, value: v3 } = await thirdReader.read();
                                  if (d3) break;
                                  buf3 += decoder.decode(v3, { stream: true });
                                  const lines3 = buf3.split("\n");
                                  buf3 = lines3.pop() || "";
                                  for (const l3 of lines3) {
                                    if (!l3.startsWith("data: ")) continue;
                                    const dd = l3.slice(6).trim();
                                    if (dd === "[DONE]") continue;
                                    try {
                                      const pp = JSON.parse(dd);
                                      if (pp.choices?.[0]?.delta?.content) {
                                        controller.enqueue(encoder.encode(`data: ${dd}\n\n`));
                                      }
                                    } catch {}
                                  }
                                }
                              }
                            }
                          }
                          continue;
                        }
                        try {
                          const p = JSON.parse(d);
                          if (p.choices?.[0]?.delta?.tool_calls) {
                            for (const stc of p.choices[0].delta.tool_calls) {
                              const idx = stc.index ?? 0;
                              if (!secondToolCalls[idx]) secondToolCalls[idx] = { function: { name: "", arguments: "" } };
                              if (stc.function?.name) secondToolCalls[idx].function.name += stc.function.name;
                              if (stc.function?.arguments) secondToolCalls[idx].function.arguments += stc.function.arguments;
                            }
                            continue;
                          }
                          if (p.choices?.[0]?.delta?.content) {
                            controller.enqueue(encoder.encode(`data: ${d}\n\n`));
                          }
                        } catch {}
                      }
                    }
                  }

                  // Send images as a special event
                  if (allImages.length > 0) {
                    // Deduplicate images
                    const uniqueImages = [...new Set(allImages)];
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "" } }], images: uniqueImages })}\n\n`));
                  }
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { function: { name: "", arguments: "" } };
                  if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
                continue;
              }

              if (delta?.content) {
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            } catch { /* skip malformed */ }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
