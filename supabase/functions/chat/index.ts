import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, mode, searchEnabled, deepResearch } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");

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
    const searchTools = ((searchEnabled || isDeepResearch) && SERPER_API_KEY) ? [
      {
        type: "function",
        function: {
          name: "WEB_SEARCH",
          description: isDeepResearch
            ? "Perform a comprehensive deep research web search. You MUST call this tool MULTIPLE TIMES (at least 3-5 searches) with different queries to gather comprehensive information from multiple angles. Search for: overview, recent developments, expert opinions, data/statistics, and counterarguments. Be thorough and exhaustive."
            : "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, product prices, news, weather, or anything that benefits from real-time data. Do NOT search for casual greetings or simple conversational messages.",
          parameters: { type: "object", properties: { query: { type: "string", description: "Search query" }, include_images: { type: "boolean", description: "Whether to include relevant images in results." } }, required: ["query"] },
        },
      },
    ] : [];

    // System prompt
    let systemPrompt: string;
    if (mode === "files") {
      systemPrompt = `You are Megsy, a document creation assistant made by Megsy AI. The current year is 2026. Rules:
- Create comprehensive, detailed, well-structured documents.
- When asked to generate HTML documents, make them professional, thorough, and visually polished with proper CSS styling.
- Include ALL relevant sections, details, and content. Do NOT abbreviate or shorten anything.
- Write FULL paragraphs, complete lists, and detailed explanations.
- If the user asks for a report, write at least 2000 words. If a presentation, include at least 10 detailed slides.
- When the user attaches images, analyze them carefully and incorporate your observations into the document.
- When the user attaches documents/files, read the content thoroughly and use it in your response.
- Match the user's language and dialect exactly.
- Never use emoji.
- Vary your descriptions and follow-up suggestions. Never repeat the same phrases.
- Always end with a specific follow-up question related to what was created.
- If web search is enabled, use it to find real data, statistics, and references for the document.`;
    } else if (isDeepResearch) {
      const isMegsyModel = requestedModel.includes("gemini-3-flash");
      const identityLine = isMegsyModel
        ? "- Your name is Megsy. You were created by Megsy AI company. Never mention Google, Gemini, or any other company as your creator."
        : "";
      systemPrompt = `You are Megsy, a Deep Research AI assistant made by Megsy AI. The current year is 2026. Rules:
${identityLine}
- You are in DEEP RESEARCH mode. Your job is to conduct thorough, comprehensive research on the user's topic.
- You MUST use the WEB_SEARCH tool MULTIPLE TIMES (3-5+ different searches) to gather information from various angles.
- After gathering all information, synthesize it into a comprehensive, well-structured research report.
- Your report should include: Executive Summary, Key Findings, Detailed Analysis, Data & Statistics, Expert Opinions, Counterarguments/Limitations, and Conclusion.
- Use markdown formatting extensively: headers (##, ###), bold, bullet points, numbered lists, and tables where appropriate.
- Cite all sources with links in the format [Source Name](URL).
- Match the user's language and dialect exactly.
- Be thorough - aim for at least 1500-2000 words in your final report.
- Include relevant images when available by using the include_images parameter in your searches.
- Never use emoji.
- Always end with follow-up questions for deeper exploration.`;
    } else {
      const isMegsyModel = requestedModel.includes("gemini-3-flash");
      const isGeminiModel = requestedModel.includes("gemini") && !isMegsyModel;
      const isGptModel = requestedModel.includes("gpt");
      const isGrokModel = requestedModel.includes("grok") || requestedModel.includes("x-ai");

      let identityLine = "";
      if (isMegsyModel) {
        identityLine = "- Your name is Megsy. You were created by Megsy AI company. If anyone asks who made you or what model you are, say you are Megsy, built by Megsy AI. Never mention Google, Gemini, or any other company as your creator.";
      } else if (isGeminiModel) {
        identityLine = "- You are Google Gemini, made by Google. If anyone asks who you are, say you are Gemini by Google.";
      } else if (isGptModel) {
        identityLine = "- You are GPT, made by OpenAI. If anyone asks who you are, say you are GPT by OpenAI.";
      } else if (isGrokModel) {
        identityLine = "- You are Grok, made by xAI. If anyone asks who you are, say you are Grok by xAI.";
      }

      systemPrompt = `You are Megsy, a friendly AI assistant and the user's buddy. The current year is 2026. Rules:
${identityLine}
- Match the user's language and dialect exactly. If they write in Egyptian Arabic, respond in Egyptian Arabic. If English, respond in English.
- Adapt response length to the question complexity: simple questions get 1-3 sentence answers; complex topics, coding, analysis get thorough, detailed responses with full explanations, examples, and code blocks.
- Adapt to the user's mood - be supportive when they're frustrated, enthusiastic when they're excited, casual when they're relaxed.
- Never use emoji in your responses. Not a single one.
- Use markdown formatting when it helps: bold for emphasis, code blocks for code, bullet points for lists, tables for comparisons.
- Be direct and honest. Don't over-explain simple things.
- When the user greets you casually, respond casually and briefly.
- When the user sends an image, analyze it carefully: describe what you see, answer questions about it, and provide relevant insights.
- When the user sends a file, read it thoroughly and respond based on its content.
- IMPORTANT: Always end your response with a brief, engaging follow-up question related to the topic to keep the conversation active. Make it natural, not forced.
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
        ...(apiUrl.includes("openrouter") ? { "HTTP-Referer": "https://megsyai.com", "X-Title": "Megsy" } : {}),
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
                // Process ALL tool calls - for deep research this may be multiple searches
                const allSearchResults: string[] = [];
                const allImages: string[] = [];
                let lastToolCall: any = null;

                for (const tc of toolCalls) {
                  try {
                    const toolName = tc.function?.name;
                    const toolArgs = JSON.parse(tc.function?.arguments || "{}");

                    if (toolName === "WEB_SEARCH" && SERPER_API_KEY) {
                      lastToolCall = tc;
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
                        imageData.images.slice(0, 4).forEach((img: any) => {
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
                            for (const stc of secondToolCalls) {
                              try {
                                const sToolName = stc.function?.name;
                                const sToolArgs = JSON.parse(stc.function?.arguments || "{}");
                                if (sToolName === "WEB_SEARCH" && SERPER_API_KEY) {
                                  const sr = await fetch("https://google.serper.dev/search", {
                                    method: "POST",
                                    headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
                                    body: JSON.stringify({ q: sToolArgs.query || "", num: 8 }),
                                  });
                                  const sd = await sr.json();
                                  let ctx = `Search: "${sToolArgs.query}"\n`;
                                  if (sd.organic) {
                                    ctx += sd.organic.map((r: any, i: number) => `[${i+1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`).join("\n\n");
                                  }
                                  moreResults.push(ctx);
                                }
                              } catch {}
                            }

                            if (moreResults.length > 0) {
                              // Third call with all accumulated results
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
                          // Accumulate tool calls from second response
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
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "" } }], images: allImages })}\n\n`));
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
