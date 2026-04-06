import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const ttl = Math.min(Math.max(Number(body?.ttl_seconds) || 60, 30), 300);
    const deepgramKey = Deno.env.get("DEEPGRAM_APIKEY");

    if (!deepgramKey) {
      return new Response(JSON.stringify({ error: "Deepgram secret is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenResp = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        "Authorization": `Token ${deepgramKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: ttl }),
    });

    const raw = await tokenResp.text();
    if (!tokenResp.ok) {
      return new Response(JSON.stringify({ error: `Deepgram token error: ${raw}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(raw);
    const token = parsed?.access_token || parsed?.token || parsed?.key;
    if (!token) throw new Error("No temporary token returned from Deepgram");

    return new Response(JSON.stringify({ token, expires_in: parsed?.expires_in || ttl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});