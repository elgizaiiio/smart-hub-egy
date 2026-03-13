import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Image model customizations
  const imageConfigs: Record<string, any> = {
    "megsy-imagine": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","21:9","16:9","3:2","4:3","5:4","1:1","4:5","3:4","2:3","9:16"] },
        q: { on: true, opts: ["1K","2K","4K"], def: "2K", price: { "4K": 4 } },
        ni: { on: true, max: 4 }
      })
    },
    "nano-banana-pro": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","21:9","16:9","3:2","4:3","5:4","1:1","4:5","3:4","2:3","9:16"] },
        q: { on: true, opts: ["1K","2K","4K"], def: "2K", price: { "4K": 10 } },
        ni: { on: true, max: 4 }
      })
    },
    "nano-banana-2": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","21:9","16:9","3:2","4:3","5:4","1:1","4:5","3:4","2:3","9:16"] },
        q: { on: true, opts: ["0.5K","1K","2K","4K"], def: "2K", price: { "4K": 5 } },
        ni: { on: true, max: 4 }
      })
    },
    "gpt-image-1.5": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "gpt-image-1-mini": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "kling-o3": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","21:9","16:9","3:2","4:3","1:1","3:4","2:3","9:16"] },
        q: { on: true, opts: ["1K","2K","4K"], def: "2K" },
        ni: { on: false }
      })
    },
    "ideogram-3": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "flux-2-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: false }
      })
    },
    "imagen-4": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","16:9","4:3","1:1","3:4","9:16"] },
        q: { on: true, opts: ["1K","2K"], def: "1K" },
        ni: { on: true, max: 4 }
      })
    },
    "seedream-5": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: true, opts: ["2K","3K"], def: "2K" },
        ni: { on: true, max: 4 }
      })
    },
    "seedream-4.5": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "kling-3.0": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","21:9","16:9","3:2","4:3","1:1","3:4","2:3","9:16"] },
        q: { on: true, opts: ["1K","2K"], def: "1K" },
        ni: { on: false }
      })
    },
    "flux-pro-ultra": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "nano-banana": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","21:9","16:9","3:2","4:3","5:4","1:1","4:5","3:4","2:3","9:16"] },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "wan-2.6-img": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "grok-imagine": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "imagine-art": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["Auto","16:9","3:2","4:3","1:1","4:5","3:4","2:3","9:16","3:1"] },
        q: { on: false },
        ni: { on: false }
      })
    },
    "z-image-turbo": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: true, max: 4 }
      })
    },
    "hunyuan-v3": {
      customization: JSON.stringify({
        ar: { on: false },
        q: { on: false },
        ni: { on: false }
      })
    },
  };

  // Video model customizations
  const videoConfigs: Record<string, any> = {
    "megsy-video": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["16:9","9:16"] },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "veo-3.1": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["16:9","9:16"] },
        dur: { on: true, opts: ["4","6","8"] },
      })
    },
    "veo-3.1-fast": {
      customization: JSON.stringify({
        ar: { on: true, opts: ["16:9","9:16"] },
        dur: { on: true, opts: ["4","6","8"] },
      })
    },
    "kling-3-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "kling-o3-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "grok-video": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
    "sora-2-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "sora-2": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "seedance-1.5-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "seedance-1.0-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "seedance-1.0-fast": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10","15"] },
      })
    },
    "kling-2.6-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
    "kling-1.6-pro": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
    "kling-2.5-turbo": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
    "kling-2.1": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
    "wan-2.6": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
    "ltx-2": {
      customization: JSON.stringify({
        ar: { on: false },
        dur: { on: true, opts: ["5","10"] },
      })
    },
  };

  const allConfigs = { ...imageConfigs, ...videoConfigs };
  const results: string[] = [];

  for (const [modelId, config] of Object.entries(allConfigs)) {
    const key = `model_config_${modelId}`;
    // Read existing config to preserve icon_url
    const { data: existing } = await sb
      .from("memories")
      .select("value")
      .eq("key", key)
      .single();

    let merged = config;
    if (existing) {
      try {
        const old = JSON.parse(existing.value);
        merged = { ...old, ...config };
      } catch {}
    }

    const { error } = await sb
      .from("memories")
      .upsert({ key, value: JSON.stringify(merged) }, { onConflict: "key" });

    results.push(`${modelId}: ${error ? error.message : "OK"}`);
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
