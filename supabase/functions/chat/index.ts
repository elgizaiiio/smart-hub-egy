import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, mode, searchEnabled } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");

    // Determine which gateway to use based on model
    let apiUrl: string;
    let apiKey: string;
    let modelId: string;

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

    // Build Composio tools for function calling
    const composioTools = COMPOSIO_API_KEY ? [
      {
        type: "function",
        function: {
          name: "GMAIL_SEND_EMAIL",
          description: "Send an email using Gmail",
          parameters: { type: "object", properties: { to: { type: "string", description: "Recipient email" }, subject: { type: "string" }, body: { type: "string", description: "Email body (HTML supported)" } }, required: ["to", "subject", "body"] },
        },
      },
      {
        type: "function",
        function: {
          name: "GMAIL_LIST_EMAILS",
          description: "List recent emails from Gmail inbox",
          parameters: { type: "object", properties: { max_results: { type: "number", description: "Max emails to return", default: 5 }, query: { type: "string", description: "Search query" } } },
        },
      },
      {
        type: "function",
        function: {
          name: "GITHUB_CREATE_ISSUE",
          description: "Create a GitHub issue",
          parameters: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, body: { type: "string" } }, required: ["owner", "repo", "title"] },
        },
      },
      {
        type: "function",
        function: {
          name: "GITHUB_LIST_REPOS",
          description: "List user's GitHub repositories",
          parameters: { type: "object", properties: { per_page: { type: "number", default: 10 } } },
        },
      },
      {
        type: "function",
        function: {
          name: "SLACK_SEND_MESSAGE",
          description: "Send a message to a Slack channel",
          parameters: { type: "object", properties: { channel: { type: "string", description: "Channel name or ID" }, text: { type: "string" } }, required: ["channel", "text"] },
        },
      },
      {
        type: "function",
        function: {
          name: "GOOGLE_CALENDAR_CREATE_EVENT",
          description: "Create a Google Calendar event",
          parameters: { type: "object", properties: { title: { type: "string" }, start_time: { type: "string", description: "ISO 8601 start time" }, end_time: { type: "string", description: "ISO 8601 end time" }, description: { type: "string" } }, required: ["title", "start_time", "end_time"] },
        },
      },
      {
        type: "function",
        function: {
          name: "GOOGLE_CALENDAR_LIST_EVENTS",
          description: "List upcoming Google Calendar events",
          parameters: { type: "object", properties: { max_results: { type: "number", default: 10 } } },
        },
      },
      {
        type: "function",
        function: {
          name: "GOOGLE_DRIVE_LIST_FILES",
          description: "List files in Google Drive",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, max_results: { type: "number", default: 10 } } },
        },
      },
      {
        type: "function",
        function: {
          name: "NOTION_CREATE_PAGE",
          description: "Create a page in Notion",
          parameters: { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, parent_page_id: { type: "string" } }, required: ["title", "content"] },
        },
      },
      {
        type: "function",
        function: {
          name: "DISCORD_SEND_MESSAGE",
          description: "Send a message to a Discord channel",
          parameters: { type: "object", properties: { channel_id: { type: "string" }, content: { type: "string" } }, required: ["channel_id", "content"] },
        },
      },
      {
        type: "function",
        function: {
          name: "LINKEDIN_CREATE_POST",
          description: "Create a LinkedIn post",
          parameters: { type: "object", properties: { text: { type: "string", description: "Post content" } }, required: ["text"] },
        },
      },
      {
        type: "function",
        function: {
          name: "YOUTUBE_LIST_VIDEOS",
          description: "List videos from a YouTube channel",
          parameters: { type: "object", properties: { query: { type: "string" }, max_results: { type: "number", default: 5 } } },
        },
      },
    ] : [];

    // Build search tool if search is enabled
    const searchTools = (searchEnabled && SERPER_API_KEY) ? [
      {
        type: "function",
        function: {
          name: "WEB_SEARCH",
          description: "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, product prices, news, weather, or anything that benefits from real-time data. Do NOT search for casual greetings or simple conversational messages.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, include_images: { type: "boolean", description: "Whether to include relevant images in results. Set true for visual topics like places, products, people, food. Set false for abstract questions, code, definitions." } }, required: ["query"] },
        },
      },
    ] : [];

    // System prompt
    let systemPrompt: string;
    if (mode === "files") {
      systemPrompt = "You are Megsy, a document creation assistant. Create comprehensive, detailed, well-structured documents. When asked to generate HTML documents, make them professional, thorough, and visually polished with proper CSS styling. Include all relevant sections, details, and content. Never create abbreviated or shortened documents. Output complete, production-quality work. Always end your response with a brief, engaging follow-up question to keep the conversation going.";
    } else {
      systemPrompt = `You are Megsy, a friendly AI assistant and the user's buddy. Rules:
- Match the user's language and dialect exactly. If they write in Egyptian Arabic, respond in Egyptian Arabic. If English, respond in English.
- Be concise for simple questions (1-3 sentences). Be detailed and thorough for complex questions, coding help, or when the user clearly needs depth.
- Adapt to the user's mood - be supportive when they're frustrated, enthusiastic when they're excited, casual when they're relaxed.
- Never use emoji in your responses. Not a single one.
- Use markdown formatting when it helps: bold for emphasis, code blocks for code, bullet points for lists.
- Be direct and honest. Don't over-explain simple things.
- When the user greets you casually, respond casually and briefly.
- IMPORTANT: Always end your response with a brief, engaging follow-up question related to the topic to keep the conversation active and the user engaged. Make it natural, not forced.
- You have access to integration tools (Gmail, GitHub, Slack, Calendar, Drive, Notion, Discord, LinkedIn, YouTube). When the user asks to perform actions with these services, use the appropriate tool. If a tool call fails because the user hasn't connected the service, tell them to connect it from Settings > Integrations.`;
      if (searchEnabled) {
        systemPrompt += `\n- You have access to a WEB_SEARCH tool. Use it ONLY when the question genuinely needs current or factual information from the internet. For casual conversation, greetings, opinions, or things you already know well, do NOT search. Be smart about when to search. When you do search, synthesize the results naturally and cite sources with links.`;
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

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://egy.app", "X-Title": "egy" } : {}),
      },
      body: JSON.stringify(body),
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

    // Handle streaming with potential tool calls
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let toolCalls: any[] = [];
    let accumulatedContent = "";

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
                for (const tc of toolCalls) {
                  try {
                    const toolName = tc.function?.name;
                    const toolArgs = JSON.parse(tc.function?.arguments || "{}");

                    // Handle WEB_SEARCH tool
                    if (toolName === "WEB_SEARCH" && SERPER_API_KEY) {
                      const searchQuery = toolArgs.query || "";
                      const includeImages = toolArgs.include_images ?? false;
                      
                      const fetches: Promise<Response>[] = [
                        fetch("https://google.serper.dev/search", {
                          method: "POST",
                          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                          body: JSON.stringify({ q: searchQuery, num: 8 }),
                        }),
                      ];
                      if (includeImages) {
                        fetches.push(fetch("https://google.serper.dev/images", {
                          method: "POST",
                          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                          body: JSON.stringify({ q: searchQuery, num: 4 }),
                        }));
                      }

                      const responses = await Promise.all(fetches);
                      const searchData = await responses[0].json();
                      const imageData = includeImages && responses[1] ? await responses[1].json() : null;

                      let context = "";
                      const images: string[] = [];

                      if (searchData.organic) {
                        context = searchData.organic.map((r: any, i: number) =>
                          `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`
                        ).join("\n\n");
                      }
                      if (searchData.knowledgeGraph) {
                        const kg = searchData.knowledgeGraph;
                        context = `${kg.title || ""}\n${kg.description || ""}\n\n${context}`;
                        if (kg.imageUrl) images.push(kg.imageUrl);
                      }
                      if (imageData?.images) {
                        imageData.images.slice(0, 4).forEach((img: any) => {
                          if (img.imageUrl) images.push(img.imageUrl);
                        });
                      }

                      // Now make a second AI call with search results to generate the final answer
                      const searchMessages = [
                        ...body.messages,
                        { role: "assistant", content: null, tool_calls: [{ id: "search_0", type: "function", function: { name: "WEB_SEARCH", arguments: tc.function.arguments } }] },
                        { role: "tool", tool_call_id: "search_0", content: context || "No results found." },
                      ];

                      const secondBody: any = { model: modelId, messages: searchMessages, stream: true };

                      const secondResp = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${apiKey}`,
                          "Content-Type": "application/json",
                          ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://egy.app", "X-Title": "egy" } : {}),
                        },
                        body: JSON.stringify(secondBody),
                      });

                      if (secondResp.ok && secondResp.body) {
                        const secondReader = secondResp.body.getReader();
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
                              if (p.choices?.[0]?.delta?.content) {
                                controller.enqueue(encoder.encode(`data: ${d}\n\n`));
                              }
                            } catch {}
                          }
                        }
                      }

                      // Send images as a special event if any
                      if (images.length > 0) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "" } }], images })}\n\n`));
                      }

                      continue;
                    }

                    // Handle Composio tools
                    if (!COMPOSIO_API_KEY) continue;

                    // Get connected account
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
                      const msg = `\n\n---\n**Tool: ${toolName}** - Service not connected. Please connect it from Settings > Integrations first.`;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`));
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
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              // Accumulate tool calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { function: { name: "", arguments: "" } };
                  if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
                continue; // Don't forward tool call deltas to client
              }

              // Forward regular content
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
