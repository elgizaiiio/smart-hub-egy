import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  
  // Delete models_added, models_hidden, and all model_config_* entries
  await sb.from("memories").delete().eq("key", "models_added");
  await sb.from("memories").delete().eq("key", "models_hidden");
  
  // Get all model_config entries
  const { data } = await sb.from("memories").select("id, key").like("key", "model_config_%");
  if (data && data.length > 0) {
    for (const row of data) {
      await sb.from("memories").delete().eq("id", row.id);
    }
  }
  
  return new Response(JSON.stringify({ success: true, deleted_configs: data?.length || 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
