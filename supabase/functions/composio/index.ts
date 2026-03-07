import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPOSIO_BASE = "https://backend.composio.dev/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
    if (!COMPOSIO_API_KEY) throw new Error("COMPOSIO_API_KEY is not configured");

    const { action, app, userId, tool, args, connectedAccountId } = await req.json();

    const headers = {
      "x-api-key": COMPOSIO_API_KEY,
      "Content-Type": "application/json",
    };

    // List connected accounts for a user
    if (action === "list-connections") {
      const resp = await fetch(`${COMPOSIO_BASE}/connectedAccounts?user_uuid=${encodeURIComponent(userId || "default")}`, { headers });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Composio list-connections failed [${resp.status}]: ${t}`);
      }
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initiate a new connection
    if (action === "connect") {
      if (!app) throw new Error("app is required for connect action");
      
      // Get integration ID for the app
      const intResp = await fetch(`${COMPOSIO_BASE}/integrations?appName=${encodeURIComponent(app)}`, { headers });
      if (!intResp.ok) {
        const t = await intResp.text();
        throw new Error(`Composio get-integrations failed [${intResp.status}]: ${t}`);
      }
      const intData = await intResp.json();
      const integrations = intData.items || intData;
      const integration = Array.isArray(integrations) && integrations.length > 0 ? integrations[0] : null;
      
      if (!integration) throw new Error(`No integration found for app: ${app}`);

      // Initiate connection
      const connResp = await fetch(`${COMPOSIO_BASE}/connectedAccounts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          integrationId: integration.id,
          userUuid: userId || "default",
          redirectUri: `${req.headers.get("origin") || "https://smart-hub-egy.lovable.app"}/settings/integrations`,
        }),
      });
      if (!connResp.ok) {
        const t = await connResp.text();
        throw new Error(`Composio connect failed [${connResp.status}]: ${t}`);
      }
      const connData = await connResp.json();
      return new Response(JSON.stringify(connData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute a tool action
    if (action === "execute") {
      if (!tool) throw new Error("tool is required for execute action");
      if (!connectedAccountId) throw new Error("connectedAccountId is required for execute action");

      const execResp = await fetch(`${COMPOSIO_BASE}/actions/${encodeURIComponent(tool)}/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          connectedAccountId,
          input: args || {},
        }),
      });
      if (!execResp.ok) {
        const t = await execResp.text();
        throw new Error(`Composio execute failed [${execResp.status}]: ${t}`);
      }
      const execData = await execResp.json();
      return new Response(JSON.stringify(execData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get available actions for an app
    if (action === "get-actions") {
      if (!app) throw new Error("app is required for get-actions");
      const resp = await fetch(`${COMPOSIO_BASE}/actions?appNames=${encodeURIComponent(app)}&limit=20`, { headers });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Composio get-actions failed [${resp.status}]: ${t}`);
      }
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("composio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
