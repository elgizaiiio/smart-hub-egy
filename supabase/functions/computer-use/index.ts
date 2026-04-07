import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedHBKey: { id: string; api_key: string } | null = null;
let cachedHBKeyExpiry = 0;

async function getHyperbrowserKey(sb: ReturnType<typeof createClient>, excludeId?: string): Promise<{ id: string; api_key: string } | null> {
  if (cachedHBKey && Date.now() < cachedHBKeyExpiry && cachedHBKey.id !== excludeId) return cachedHBKey;
  const { data } = await sb.from("api_keys").select("id, api_key").eq("service", "hyperbrowser").eq("is_active", true).eq("is_blocked", false).limit(20);
  if (!data || data.length === 0) return null;
  const pool = excludeId ? data.filter((k: any) => k.id !== excludeId) : data;
  if (pool.length === 0) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  cachedHBKey = pick;
  cachedHBKeyExpiry = Date.now() + CACHE_TTL_MS;
  return pick;
}

function blockHBKey(sb: ReturnType<typeof createClient>, keyId: string, reason: string) {
  if (cachedHBKey?.id === keyId) cachedHBKey = null;
  sb.from("api_keys").update({ is_blocked: true, block_reason: reason, last_error_at: new Date().toISOString() }).eq("id", keyId).then(() => {});
}

function markHBKeyUsed(sb: ReturnType<typeof createClient>, keyId: string) {
  sb.from("api_keys").update({ last_used_at: new Date().toISOString(), usage_count: 1 }).eq("id", keyId).then(() => {});
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal, url, action, extract_schema } = await req.json();
    
    if (!goal && !url) {
      return new Response(JSON.stringify({ error: "Missing goal or url" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    let hbKey = await getHyperbrowserKey(sb);
    if (!hbKey) {
      return new Response(JSON.stringify({ error: "No Hyperbrowser keys available", needsKey: true }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const pushStatus = (status: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));
        };
        const pushData = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let retries = 0;
        const MAX_RETRIES = 2;

        while (retries <= MAX_RETRIES) {
          try {
            pushStatus(`يفتح المتصفح الذكي...`);
            
            // Create a session
            const sessionResp = await fetch("https://app.hyperbrowser.ai/api/v2/sessions", {
              method: "POST",
              headers: {
                "x-api-key": hbKey!.api_key,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                screen: { width: 1280, height: 720 },
              }),
            });

            if (!sessionResp.ok) {
              const errText = await sessionResp.text();
              if ((sessionResp.status === 401 || sessionResp.status === 403) && retries < MAX_RETRIES) {
                blockHBKey(sb, hbKey!.id, `HTTP ${sessionResp.status}`);
                const newKey = await getHyperbrowserKey(sb, hbKey!.id);
                if (newKey) {
                  hbKey = newKey;
                  retries++;
                  continue;
                }
              }
              throw new Error(`Session creation failed: ${sessionResp.status} ${errText}`);
            }

            const session = await sessionResp.json();
            const sessionId = session.id;
            markHBKeyUsed(sb, hbKey!.id);

            pushStatus(`تم فتح المتصفح بنجاح`);

            // If we have a specific URL, navigate to it
            if (url) {
              pushStatus(`يتصفح ${new URL(url).hostname}...`);
            }

            // Use the AI agent endpoint for autonomous browsing
            const agentResp = await fetch(`https://app.hyperbrowser.ai/api/v2/agents/browser-use`, {
              method: "POST",
              headers: {
                "x-api-key": hbKey!.api_key,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                task: goal || `Navigate to ${url} and extract the main content`,
                sessionId,
                maxSteps: 15,
              }),
            });

            if (!agentResp.ok) {
              const errText = await agentResp.text();
              // Try to close session
              await fetch(`https://app.hyperbrowser.ai/api/v2/sessions/${sessionId}/stop`, {
                method: "POST",
                headers: { "x-api-key": hbKey!.api_key },
              }).catch(() => {});
              throw new Error(`Agent failed: ${agentResp.status} ${errText}`);
            }

            const agentResult = await agentResp.json();
            
            // Stream steps as status updates
            if (agentResult.steps && Array.isArray(agentResult.steps)) {
              for (const step of agentResult.steps) {
                if (step.description) {
                  pushStatus(step.description);
                }
              }
            }

            pushStatus("تم الانتهاء من التصفح");

            // Send the final result
            pushData({
              type: "browser_result",
              result: agentResult.output || agentResult.result || agentResult,
              steps: agentResult.steps?.map((s: any) => s.description).filter(Boolean) || [],
            });

            // Close session
            await fetch(`https://app.hyperbrowser.ai/api/v2/sessions/${sessionId}/stop`, {
              method: "POST",
              headers: { "x-api-key": hbKey!.api_key },
            }).catch(() => {});

            break; // Success, exit retry loop

          } catch (err) {
            console.error(`Computer-use attempt ${retries + 1} error:`, err);
            if (retries >= MAX_RETRIES) {
              pushData({
                type: "browser_error",
                error: err instanceof Error ? err.message : "Unknown browser error",
              });
            }
            retries++;
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
    console.error("Computer-use error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
