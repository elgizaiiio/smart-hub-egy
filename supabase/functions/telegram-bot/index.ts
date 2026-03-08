import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_MODELS = [
  "megsy-v1-img", "gpt-image", "nano-banana-2", "flux-kontext", "ideogram-3",
  "seedream-5-lite", "recraft-v4", "flux-2-pro", "seedream-4", "grok-imagine",
  "imagineart-1.5", "fal-hidream-i1", "fal-aura-v2", "fal-stable-cascade",
  "fal-omnigen2", "fal-flux-realism", "logo-creator", "sticker-maker", "qr-art",
  "nano-banana-edit", "object-remover", "watermark-remover", "image-extender",
  "flux-pro-editor", "image-variations", "photo-colorizer", "bg-remover",
  "4k-upscaler", "face-enhancer", "creative-upscaler", "old-photo-restorer",
  "bg-replacer", "style-transfer", "ai-relighting", "photo-to-cartoon",
  "product-photo", "ai-headshot",
];

const VIDEO_MODELS = [
  "megsy-video", "veo-3.1", "veo-3.1-fast", "kling-3-pro", "kling-o1",
  "openai-sora", "pika-2.2", "luma-dream", "seedance-pro", "wan-2.6",
  "pixverse-5.5", "megsy-video-i2v", "kling-3-pro-i2v", "kling-o1-i2v",
  "veo-3.1-fast-i2v", "openai-sora-i2v", "pixverse-5.5-i2v", "wan-2.6-i2v",
  "wan-flf", "kling-avatar-pro", "kling-avatar-std", "sadtalker", "sync-lipsync",
];

const CHAT_MODELS = [
  "google/gemini-3-flash-preview", "google/gemini-2.5-pro",
  "openai/gpt-5", "x-ai/grok-3", "deepseek/deepseek-r1",
];

const CODE_MODELS = ["x-ai/grok-3", "openai/gpt-5", "deepseek/deepseek-r1"];

const MODEL_NAMES: Record<string, string> = {
  "megsy-v1-img": "Megsy v1", "gpt-image": "GPT Image 1.5", "nano-banana-2": "Nano Banana 2",
  "flux-kontext": "FLUX Kontext Max", "ideogram-3": "Ideogram 3", "seedream-5-lite": "Seedream 5 Lite",
  "recraft-v4": "Recraft V4", "flux-2-pro": "FLUX 2 Pro", "seedream-4": "Seedream 4.5",
  "grok-imagine": "Grok Imagine", "imagineart-1.5": "ImagineArt 1.5", "fal-hidream-i1": "HiDream I1",
  "fal-aura-v2": "Aura Flow v2", "fal-stable-cascade": "Stable Cascade", "fal-omnigen2": "OmniGen2",
  "fal-flux-realism": "FLUX Realism", "logo-creator": "Logo Creator", "sticker-maker": "Sticker Maker",
  "qr-art": "QR Art", "nano-banana-edit": "Nano Banana Edit", "object-remover": "Object Remover",
  "watermark-remover": "Watermark Remover", "image-extender": "Image Extender",
  "flux-pro-editor": "FLUX Pro Editor", "image-variations": "Image Variations",
  "photo-colorizer": "Photo Colorizer", "bg-remover": "BG Remover", "4k-upscaler": "4K Upscaler",
  "face-enhancer": "Face Enhancer", "creative-upscaler": "Creative Upscaler",
  "old-photo-restorer": "Old Photo Restorer", "bg-replacer": "BG Replacer",
  "style-transfer": "Style Transfer", "ai-relighting": "AI Relighting",
  "photo-to-cartoon": "Photo to Cartoon", "product-photo": "Product Photo", "ai-headshot": "AI Headshot",
  "megsy-video": "Megsy Video", "veo-3.1": "Google Veo 3.1", "veo-3.1-fast": "Veo 3.1 Fast",
  "kling-3-pro": "Kling 3.0 Pro", "kling-o1": "Kling O1", "openai-sora": "OpenAI Sora",
  "pika-2.2": "Pika 2.2", "luma-dream": "Luma Dream Machine", "seedance-pro": "Seedance Pro",
  "wan-2.6": "WAN 2.6", "pixverse-5.5": "PixVerse v5.5", "megsy-video-i2v": "Megsy Video I2V",
  "kling-3-pro-i2v": "Kling 3.0 Pro I2V", "kling-o1-i2v": "Kling O1 I2V",
  "veo-3.1-fast-i2v": "Veo 3.1 Fast I2V", "openai-sora-i2v": "Sora I2V",
  "pixverse-5.5-i2v": "PixVerse I2V", "wan-2.6-i2v": "WAN 2.6 I2V",
  "wan-flf": "WAN First-Last-Frame", "kling-avatar-pro": "Kling Avatar Pro",
  "kling-avatar-std": "Kling Avatar Std", "sadtalker": "SadTalker", "sync-lipsync": "Sync Lipsync V2",
  "google/gemini-3-flash-preview": "Megsy V1 (Chat)", "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "openai/gpt-5": "GPT-5", "x-ai/grok-3": "Grok 3", "deepseek/deepseek-r1": "DeepSeek R1",
};

// ---- Persistent session helpers ----
interface BotSession {
  page?: "images" | "videos";
  modelIndex?: number;
  models?: string[];
  adminAction?: string;
  adminModelId?: string;
  adminField?: string;
  adminUserId?: string;
}

async function loadSession(sb: ReturnType<typeof createClient>, chatId: number): Promise<BotSession | null> {
  const { data } = await sb.from("memories").select("value").eq("key", `tg_${chatId}`).maybeSingle();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

async function saveSession(sb: ReturnType<typeof createClient>, chatId: number, session: BotSession) {
  await sb.from("memories").delete().eq("key", `tg_${chatId}`);
  await sb.from("memories").insert({ key: `tg_${chatId}`, value: JSON.stringify(session) });
}

async function clearSession(sb: ReturnType<typeof createClient>, chatId: number) {
  await sb.from("memories").delete().eq("key", `tg_${chatId}`);
}

async function callTelegram(token: string, method: string, body: Record<string, unknown>) {
  const resp = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function getExistingMedia(sb: ReturnType<typeof createClient>, models: string[]) {
  const { data } = await sb.from("model_media").select("model_id").in("model_id", models);
  return new Set((data || []).map((r: { model_id: string }) => r.model_id));
}

// ---- Model config helpers (stored in memories table) ----
async function getModelConfig(sb: ReturnType<typeof createClient>, modelId: string): Promise<Record<string, string> | null> {
  const { data } = await sb.from("memories").select("value").eq("key", `model_config_${modelId}`).maybeSingle();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

async function setModelConfig(sb: ReturnType<typeof createClient>, modelId: string, config: Record<string, string>) {
  await sb.from("memories").delete().eq("key", `model_config_${modelId}`);
  await sb.from("memories").insert({ key: `model_config_${modelId}`, value: JSON.stringify(config) });
}

function isAdmin(_chatId: number): boolean {
  return true; // All users can access admin panel
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!BOT_TOKEN) return new Response("BOT_TOKEN missing", { status: 500 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const update = await req.json();
    const message = update.message;
    const callback = update.callback_query;

    if (callback) {
      const chatId = callback.message.chat.id;
      const data = callback.data;
      await callTelegram(BOT_TOKEN, "answerCallbackQuery", { callback_query_id: callback.id });

      // ---- Media upload flow ----
      if (data === "page_images" || data === "page_videos") {
        const page = data === "page_images" ? "images" : "videos";
        const allModels = page === "images" ? IMAGE_MODELS : VIDEO_MODELS;
        const existing = await getExistingMedia(sb, allModels);
        const remaining = allModels.filter(m => !existing.has(m));

        if (remaining.length === 0) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `All ${page} models already have media!` });
          return new Response("OK");
        }

        const session: BotSession = { page, modelIndex: 0, models: remaining };
        await saveSession(sb, chatId, session);
        const modelId = remaining[0];
        const modelName = MODEL_NAMES[modelId] || modelId;

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `*${page === "images" ? "Image" : "Video"} Models*\nRemaining: *${remaining.length}*\n\nModel: *${modelName}*\nID: \`${modelId}\`\n\nSend ${page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]] }),
        });
        return new Response("OK");
      }

      if (data === "skip_model") {
        const session = await loadSession(sb, chatId);
        if (!session || !session.models) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "No active session. Press /start" });
          return new Response("OK");
        }
        session.modelIndex = (session.modelIndex || 0) + 1;
        if (session.modelIndex >= session.models.length) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "All models done!" });
          await clearSession(sb, chatId);
          return new Response("OK");
        }
        await saveSession(sb, chatId, session);
        const modelId = session.models[session.modelIndex];
        const modelName = MODEL_NAMES[modelId] || modelId;
        const remaining = session.models.length - session.modelIndex;
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `Skipped.\n\nRemaining: *${remaining}*\n\nModel: *${modelName}*\nID: \`${modelId}\`\n\nSend ${session.page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]] }),
        });
        return new Response("OK");
      }

      if (data === "status") {
        const imgExisting = await getExistingMedia(sb, IMAGE_MODELS);
        const vidExisting = await getExistingMedia(sb, VIDEO_MODELS);
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `*Status*\n\nImages: ${imgExisting.size}/${IMAGE_MODELS.length}\nVideos: ${vidExisting.size}/${VIDEO_MODELS.length}`,
          parse_mode: "Markdown",
        });
        return new Response("OK");
      }

      // ---- Admin callbacks ----
      if (data === "admin_panel" && isAdmin(chatId)) {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "🔧 *Admin Panel*\n\nChoose an action:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "📋 List Models", callback_data: "admin_list_models" }],
              [{ text: "✏️ Edit Model", callback_data: "admin_edit_model" }],
              [{ text: "👥 User Credits", callback_data: "admin_users" }],
              [{ text: "📊 System Stats", callback_data: "admin_stats" }],
              [{ text: "🔙 Back", callback_data: "back_main" }],
            ],
          }),
        });
        return new Response("OK");
      }

      if (data === "back_main") {
        await clearSession(sb, chatId);
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "*Megsy Admin Bot*\n\nChoose an action:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "📸 Image Models", callback_data: "page_images" }, { text: "🎬 Video Models", callback_data: "page_videos" }],
              [{ text: "📊 Status", callback_data: "status" }],
              ...(isAdmin(chatId) ? [[{ text: "🔧 Admin Panel", callback_data: "admin_panel" }]] : []),
            ],
          }),
        });
        return new Response("OK");
      }

      if (data === "admin_list_models" && isAdmin(chatId)) {
        const categories = [
          { label: "🖼 Image Models", models: IMAGE_MODELS },
          { label: "🎬 Video Models", models: VIDEO_MODELS },
          { label: "💬 Chat Models", models: CHAT_MODELS },
          { label: "💻 Code Models", models: CODE_MODELS },
        ];
        let text = "*All Models*\n\n";
        for (const cat of categories) {
          text += `*${cat.label}* (${cat.models.length})\n`;
          for (const m of cat.models.slice(0, 15)) {
            const config = await getModelConfig(sb, m);
            const name = config?.name || MODEL_NAMES[m] || m;
            const provider = config?.provider || "default";
            const credits = config?.credits || "—";
            text += `• \`${m}\` → ${name} [${credits} MC] (${provider})\n`;
          }
          if (cat.models.length > 15) text += `  ... +${cat.models.length - 15} more\n`;
          text += "\n";
        }
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId, text, parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Admin", callback_data: "admin_panel" }]] }),
        });
        return new Response("OK");
      }

      if (data === "admin_edit_model" && isAdmin(chatId)) {
        await saveSession(sb, chatId, { adminAction: "awaiting_model_id" });
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "✏️ *Edit Model*\n\nSend the model ID you want to edit.\nExample: `megsy-v1-img` or `openai/gpt-5`",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Cancel", callback_data: "admin_panel" }]] }),
        });
        return new Response("OK");
      }

      if (data?.startsWith("edit_field_") && isAdmin(chatId)) {
        const field = data.replace("edit_field_", "");
        const session = await loadSession(sb, chatId);
        if (!session?.adminModelId) return new Response("OK");

        const fieldLabels: Record<string, string> = {
          name: "Model Name", credits: "MC Cost", description: "Description",
          provider: "Provider ID (fal/openrouter)", capabilities: "Capabilities",
          fal_id: "fal.ai Model ID", openrouter_id: "OpenRouter Model ID",
        };

        await saveSession(sb, chatId, { ...session, adminAction: "awaiting_field_value", adminField: field });
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `Enter new *${fieldLabels[field] || field}* for \`${session.adminModelId}\`:`,
          parse_mode: "Markdown",
        });
        return new Response("OK");
      }

      if (data === "admin_users" && isAdmin(chatId)) {
        await saveSession(sb, chatId, { adminAction: "awaiting_user_email" });
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "👥 *User Management*\n\nSend user email to look up:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Cancel", callback_data: "admin_panel" }]] }),
        });
        return new Response("OK");
      }

      if (data?.startsWith("user_add_mc_") && isAdmin(chatId)) {
        const userId = data.replace("user_add_mc_", "");
        await saveSession(sb, chatId, { adminAction: "awaiting_mc_amount", adminUserId: userId });
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "Enter MC amount to add (negative to subtract):",
        });
        return new Response("OK");
      }

      if (data === "admin_stats" && isAdmin(chatId)) {
        const { count: userCount } = await sb.from("profiles").select("*", { count: "exact", head: true });
        const { count: convCount } = await sb.from("conversations").select("*", { count: "exact", head: true });
        const { count: msgCount } = await sb.from("messages").select("*", { count: "exact", head: true });
        const { count: projectCount } = await sb.from("projects").select("*", { count: "exact", head: true });
        const imgMedia = await getExistingMedia(sb, IMAGE_MODELS);
        const vidMedia = await getExistingMedia(sb, VIDEO_MODELS);

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `📊 *System Stats*\n\n` +
            `👥 Users: ${userCount || 0}\n` +
            `💬 Conversations: ${convCount || 0}\n` +
            `📝 Messages: ${msgCount || 0}\n` +
            `💻 Projects: ${projectCount || 0}\n` +
            `🖼 Image Media: ${imgMedia.size}/${IMAGE_MODELS.length}\n` +
            `🎬 Video Media: ${vidMedia.size}/${VIDEO_MODELS.length}`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Admin", callback_data: "admin_panel" }]] }),
        });
        return new Response("OK");
      }

      return new Response("OK");
    }

    if (message) {
      const chatId = message.chat.id;
      const text = message.text;

      if (text === "/start") {
        await clearSession(sb, chatId);
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "*Megsy Model Media Bot*\n\nChoose an action:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "📸 Image Models", callback_data: "page_images" }, { text: "🎬 Video Models", callback_data: "page_videos" }],
              [{ text: "📊 Status", callback_data: "status" }],
              ...(isAdmin(chatId) ? [[{ text: "🔧 Admin Panel", callback_data: "admin_panel" }]] : []),
            ],
          }),
        });
        return new Response("OK");
      }

      // ---- Handle admin text input ----
      const session = await loadSession(sb, chatId);

      if (session?.adminAction === "awaiting_model_id" && isAdmin(chatId) && text) {
        const modelId = text.trim();
        const allModels = [...IMAGE_MODELS, ...VIDEO_MODELS, ...CHAT_MODELS, ...CODE_MODELS];
        if (!allModels.includes(modelId)) {
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId,
            text: `❌ Model \`${modelId}\` not found.\n\nAvailable IDs include: ${allModels.slice(0, 10).map(m => `\`${m}\``).join(", ")}...`,
            parse_mode: "Markdown",
          });
          return new Response("OK");
        }

        const config = await getModelConfig(sb, modelId) || {};
        const name = config.name || MODEL_NAMES[modelId] || modelId;

        await saveSession(sb, chatId, { adminAction: "editing_model", adminModelId: modelId });
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `*Editing: ${name}*\nID: \`${modelId}\`\n\n` +
            `Name: ${config.name || "default"}\n` +
            `Credits: ${config.credits || "default"}\n` +
            `Provider: ${config.provider || "default"}\n` +
            `fal ID: ${config.fal_id || "—"}\n` +
            `OpenRouter ID: ${config.openrouter_id || "—"}\n` +
            `Description: ${config.description || "default"}\n` +
            `Capabilities: ${config.capabilities || "default"}\n\n` +
            `Choose what to edit:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "📝 Name", callback_data: "edit_field_name" }, { text: "💰 Credits", callback_data: "edit_field_credits" }],
              [{ text: "📄 Description", callback_data: "edit_field_description" }],
              [{ text: "🔗 fal ID", callback_data: "edit_field_fal_id" }, { text: "🔗 OpenRouter ID", callback_data: "edit_field_openrouter_id" }],
              [{ text: "⚡ Capabilities", callback_data: "edit_field_capabilities" }],
              [{ text: "🏷 Provider", callback_data: "edit_field_provider" }],
              [{ text: "🔙 Admin", callback_data: "admin_panel" }],
            ],
          }),
        });
        return new Response("OK");
      }

      if (session?.adminAction === "awaiting_field_value" && isAdmin(chatId) && text && session.adminModelId && session.adminField) {
        const config = await getModelConfig(sb, session.adminModelId) || {};
        config[session.adminField] = text.trim();
        await setModelConfig(sb, session.adminModelId, config);

        const name = config.name || MODEL_NAMES[session.adminModelId] || session.adminModelId;
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ Updated *${session.adminField}* for *${name}* to:\n\`${text.trim()}\``,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "✏️ Edit More", callback_data: "admin_edit_model" }],
              [{ text: "🔙 Admin", callback_data: "admin_panel" }],
            ],
          }),
        });
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      if (session?.adminAction === "awaiting_user_email" && isAdmin(chatId) && text) {
        const email = text.trim().toLowerCase();
        const { data: profiles } = await sb.from("profiles").select("id, credits, plan, display_name, created_at").limit(5);
        
        // We need to search by email in auth - but we can't query auth directly.
        // Let's search by display_name or just show all matching profiles
        const { data: allProfiles } = await sb.from("profiles").select("id, credits, plan, display_name, created_at");
        
        // Find profile by searching - we'll use a workaround
        let foundProfile = null;
        if (allProfiles) {
          // Try to find by display name containing email prefix
          const prefix = email.split("@")[0];
          foundProfile = allProfiles.find(p => 
            p.display_name?.toLowerCase().includes(prefix) || 
            p.display_name?.toLowerCase().includes(email)
          );
          // If not found, try the first few characters of ID
          if (!foundProfile && email.length >= 8) {
            foundProfile = allProfiles.find(p => p.id.startsWith(email));
          }
        }

        if (!foundProfile) {
          // Show recent users instead
          const recent = (allProfiles || []).slice(0, 10);
          let text = "❌ User not found by that query.\n\n*Recent Users:*\n";
          for (const p of recent) {
            text += `• ${p.display_name || "—"} | ${Number(p.credits).toFixed(0)} MC | ${p.plan}\n  ID: \`${p.id.slice(0, 8)}...\`\n`;
          }
          text += "\nTry sending a user ID (first 8+ chars) or display name.";
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Admin", callback_data: "admin_panel" }]] }),
          });
          return new Response("OK");
        }

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `👤 *User Found*\n\n` +
            `Name: ${foundProfile.display_name || "—"}\n` +
            `ID: \`${foundProfile.id}\`\n` +
            `MC: ${Number(foundProfile.credits).toFixed(2)}\n` +
            `Plan: ${foundProfile.plan}\n` +
            `Joined: ${new Date(foundProfile.created_at).toLocaleDateString()}`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "💰 Add/Remove MC", callback_data: `user_add_mc_${foundProfile.id}` }],
              [{ text: "🔙 Admin", callback_data: "admin_panel" }],
            ],
          }),
        });
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      if (session?.adminAction === "awaiting_mc_amount" && isAdmin(chatId) && text && session.adminUserId) {
        const amount = parseFloat(text.trim());
        if (isNaN(amount)) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "❌ Invalid number. Try again:" });
          return new Response("OK");
        }

        const { data: profile } = await sb.from("profiles").select("credits, display_name").eq("id", session.adminUserId).single();
        if (!profile) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "❌ User not found." });
          return new Response("OK");
        }

        const newCredits = Number(profile.credits) + amount;
        await sb.from("profiles").update({ credits: newCredits }).eq("id", session.adminUserId);
        await sb.from("credit_transactions").insert({
          user_id: session.adminUserId,
          amount: Math.abs(amount),
          action_type: amount >= 0 ? "admin_add" : "admin_deduct",
          description: `Admin adjustment: ${amount >= 0 ? "+" : ""}${amount} MC`,
        });

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ Updated *${profile.display_name || "User"}*\n\nPrevious: ${Number(profile.credits).toFixed(2)} MC\nChange: ${amount >= 0 ? "+" : ""}${amount}\nNew: ${newCredits.toFixed(2)} MC`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Admin", callback_data: "admin_panel" }]] }),
        });
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // ---- Handle photo/video upload for media management ----
      if (session?.page && session.models) {
        const currentModelId = session.models[session.modelIndex || 0];
        const currentModelName = MODEL_NAMES[currentModelId] || currentModelId;
        let fileId: string | null = null;
        let mediaType: "image" | "video" = "image";

        if (message.photo && message.photo.length > 0) {
          fileId = message.photo[message.photo.length - 1].file_id;
          mediaType = "image";
        } else if (message.video) {
          fileId = message.video.file_id;
          mediaType = "video";
        } else if (message.animation) {
          fileId = message.animation.file_id;
          mediaType = "video";
        } else if (message.document) {
          const mime = message.document.mime_type || "";
          if (mime.startsWith("image/")) { fileId = message.document.file_id; mediaType = "image"; }
          else if (mime.startsWith("video/")) { fileId = message.document.file_id; mediaType = "video"; }
        }

        if (!fileId) {
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: "Send an image or video only.",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]] }),
          });
          return new Response("OK");
        }

        const fileInfo = await callTelegram(BOT_TOKEN, "getFile", { file_id: fileId });
        const filePath = fileInfo.result?.file_path;
        if (!filePath) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "Failed to download file." });
          return new Response("OK");
        }

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        const fileResp = await fetch(fileUrl);
        const fileBuffer = await fileResp.arrayBuffer();
        const ext = filePath.split(".").pop() || (mediaType === "image" ? "jpg" : "mp4");
        const storagePath = `${currentModelId}.${ext}`;

        const { error: uploadError } = await sb.storage.from("model-media").upload(storagePath, fileBuffer, {
          contentType: mediaType === "image" ? `image/${ext}` : `video/${ext}`,
          upsert: true,
        });

        if (uploadError) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `Upload error: ${uploadError.message}` });
          return new Response("OK");
        }

        const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
        await sb.from("model_media").upsert({
          model_id: currentModelId, media_url: urlData.publicUrl, media_type: mediaType, updated_at: new Date().toISOString(),
        }, { onConflict: "model_id" });

        session.modelIndex = (session.modelIndex || 0) + 1;
        const remaining = session.models.length - session.modelIndex;

        if (remaining === 0) {
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `Uploaded for *${currentModelName}*\n\nAll models done!`, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "📸 Images", callback_data: "page_images" }, { text: "🎬 Videos", callback_data: "page_videos" }]] }),
          });
          await clearSession(sb, chatId);
          return new Response("OK");
        }

        await saveSession(sb, chatId, session);
        const nextModelId = session.models[session.modelIndex];
        const nextModelName = MODEL_NAMES[nextModelId] || nextModelId;

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `Uploaded for *${currentModelName}*\n\nRemaining: *${remaining}*\n\nNext: *${nextModelName}*\nID: \`${nextModelId}\`\n\nSend ${session.page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]] }),
        });
        return new Response("OK");
      }

      // Default
      await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "Press /start to begin." });
      return new Response("OK");
    }

    return new Response("OK");
  } catch (e) {
    console.error("Telegram bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
