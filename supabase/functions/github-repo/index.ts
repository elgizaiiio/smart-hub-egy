import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
    if (!COMPOSIO_API_KEY) throw new Error("COMPOSIO_API_KEY not configured");

    const { action, repo_name, files, description } = await req.json();

    if (action === "check-connection") {
      // Check if GitHub is connected via Composio
      const resp = await fetch("https://backend.composio.dev/api/v1/connectedAccounts", {
        headers: { "x-api-key": COMPOSIO_API_KEY },
      });
      const data = await resp.json();
      const githubConn = data.items?.find(
        (item: { appName: string; status: string }) =>
          item.appName === "github" && item.status === "ACTIVE"
      );
      return new Response(
        JSON.stringify({ connected: !!githubConn, connection_id: githubConn?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-repo") {
      // Create repo via Composio GitHub action
      const resp = await fetch("https://backend.composio.dev/api/v2/actions/GITHUB_CREATE_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER/execute", {
        method: "POST",
        headers: {
          "x-api-key": COMPOSIO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            name: repo_name,
            description: description || "Created by Megsy Code",
            private: false,
            auto_init: true,
          },
          appName: "github",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(`Composio error: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "push-files") {
      // Push files one by one via Composio
      const results = [];
      for (const file of files as { path: string; content: string }[]) {
        const b64Content = btoa(unescape(encodeURIComponent(file.content)));
        const resp = await fetch(
          "https://backend.composio.dev/api/v2/actions/GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS/execute",
          {
            method: "POST",
            headers: {
              "x-api-key": COMPOSIO_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: {
                owner: "", // will be filled by composio from connected account
                repo: repo_name,
                path: file.path,
                message: `Add ${file.path}`,
                content: b64Content,
              },
              appName: "github",
            }),
          }
        );
        const data = await resp.json();
        results.push({ path: file.path, success: resp.ok, data });
      }
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("github-repo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
