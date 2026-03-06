import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
    if (!SERPER_API_KEY) throw new Error("SERPER_API_KEY not configured");

    const resp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 8 }),
    });

    const data = await resp.json();
    
    let context = "";
    const images: string[] = [];

    if (data.organic) {
      context = data.organic.map((r: any, i: number) => 
        `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`
      ).join("\n\n");
    }

    if (data.images) {
      data.images.slice(0, 4).forEach((img: any) => {
        if (img.imageUrl) images.push(img.imageUrl);
      });
    }

    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      context = `${kg.title || ""}\n${kg.description || ""}\n\n${context}`;
      if (kg.imageUrl) images.unshift(kg.imageUrl);
    }

    return new Response(JSON.stringify({ context, images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Search error:", e);
    return new Response(JSON.stringify({ context: "", images: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
