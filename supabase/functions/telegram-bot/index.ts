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

const CATEGORIES = [
  { key: "images", label: "🖼 Image Models", emoji: "🖼", models: IMAGE_MODELS },
  { key: "videos", label: "🎬 Video Models", emoji: "🎬", models: VIDEO_MODELS },
  { key: "chat", label: "💬 Chat Models", emoji: "💬", models: CHAT_MODELS },
  { key: "code", label: "💻 Code Models", emoji: "💻", models: CODE_MODELS },
];

const MODELS_PER_PAGE = 6;
const USERS_PER_PAGE = 8;

const EDITABLE_FIELDS = [
  { key: "name", label: "📝 Name" },
  { key: "credits", label: "💰 Credits (MC)" },
  { key: "description", label: "📄 Description" },
  { key: "fal_id", label: "🔗 fal.ai ID" },
  { key: "openrouter_id", label: "🔗 OpenRouter ID" },
  { key: "provider", label: "🏷 Provider" },
  { key: "capabilities", label: "⚡ Capabilities" },
];

const MC_PRESETS = [5, 10, 25, 50, 100, 500];

// ---- Helpers ----
interface BotSession {
  // Media upload flow
  page?: "images" | "videos";
  modelIndex?: number;
  models?: string[];
  // Admin
  adminAction?: string;
  adminModelId?: string;
  adminField?: string;
  adminUserId?: string;
  adminPage?: number;
  adminCategory?: string;
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

async function tg(token: string, method: string, body: Record<string, unknown>) {
  const resp = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function editOrSend(token: string, chatId: number, msgId: number | undefined, text: string, keyboard: unknown[][], parse_mode = "Markdown") {
  if (msgId) {
    const res = await tg(token, "editMessageText", {
      chat_id: chatId, message_id: msgId, text, parse_mode,
      reply_markup: JSON.stringify({ inline_keyboard: keyboard }),
    });
    if (res.ok) return;
  }
  await tg(token, "sendMessage", {
    chat_id: chatId, text, parse_mode,
    reply_markup: JSON.stringify({ inline_keyboard: keyboard }),
  });
}

async function getExistingMedia(sb: ReturnType<typeof createClient>, models: string[]) {
  const { data } = await sb.from("model_media").select("model_id").in("model_id", models);
  return new Set((data || []).map((r: { model_id: string }) => r.model_id));
}

async function getModelConfig(sb: ReturnType<typeof createClient>, modelId: string): Promise<Record<string, string>> {
  const { data } = await sb.from("memories").select("value").eq("key", `model_config_${modelId}`).maybeSingle();
  if (!data) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

async function setModelConfig(sb: ReturnType<typeof createClient>, modelId: string, config: Record<string, string>) {
  await sb.from("memories").delete().eq("key", `model_config_${modelId}`);
  await sb.from("memories").insert({ key: `model_config_${modelId}`, value: JSON.stringify(config) });
}

// ---- Build keyboard helpers ----
function buildModelListKeyboard(models: string[], page: number, categoryKey: string, actionPrefix: string) {
  const start = page * MODELS_PER_PAGE;
  const slice = models.slice(start, start + MODELS_PER_PAGE);
  const totalPages = Math.ceil(models.length / MODELS_PER_PAGE);

  const rows: { text: string; callback_data: string }[][] = [];
  // 2 models per row
  for (let i = 0; i < slice.length; i += 2) {
    const row: { text: string; callback_data: string }[] = [];
    row.push({ text: MODEL_NAMES[slice[i]] || slice[i], callback_data: `${actionPrefix}_${slice[i]}` });
    if (slice[i + 1]) {
      row.push({ text: MODEL_NAMES[slice[i + 1]] || slice[i + 1], callback_data: `${actionPrefix}_${slice[i + 1]}` });
    }
    rows.push(row);
  }

  // Pagination
  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) navRow.push({ text: "◀️ Prev", callback_data: `nav_${actionPrefix}_${categoryKey}_${page - 1}` });
  navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) navRow.push({ text: "Next ▶️", callback_data: `nav_${actionPrefix}_${categoryKey}_${page + 1}` });
  rows.push(navRow);

  rows.push([{ text: "🔙 Back", callback_data: `back_${actionPrefix}_cats` }]);
  return rows;
}

function buildCategoryKeyboard(actionPrefix: string) {
  return CATEGORIES.map(c => [{ text: `${c.emoji} ${c.label.split(" ").slice(1).join(" ")} (${c.models.length})`, callback_data: `cat_${actionPrefix}_${c.key}` }]);
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

    // ========================
    //   CALLBACK QUERIES
    // ========================
    if (callback) {
      const chatId = callback.message.chat.id;
      const msgId = callback.message.message_id;
      const data = callback.data;
      await tg(BOT_TOKEN, "answerCallbackQuery", { callback_query_id: callback.id });

      // ---- NOOP ----
      if (data === "noop") return new Response("OK");

      // ---- MAIN MENU ----
      if (data === "main_menu") {
        await clearSession(sb, chatId);
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "🤖 *Megsy Admin Bot*\n\nChoose an action:",
          [
            [{ text: "📸 Upload Media", callback_data: "upload_menu" }],
            [{ text: "🔧 Edit Models", callback_data: "edit_menu" }],
            [{ text: "👥 Users", callback_data: "users_menu" }],
            [{ text: "📊 Stats", callback_data: "admin_stats" }],
          ]
        );
        return new Response("OK");
      }

      // ==== UPLOAD MEDIA FLOW ====
      if (data === "upload_menu") {
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "📤 *Upload Media*\n\nChoose category:",
          [
            [{ text: "📸 Image Models", callback_data: "page_images" }, { text: "🎬 Video Models", callback_data: "page_videos" }],
            [{ text: "📊 Upload Status", callback_data: "upload_status" }],
            [{ text: "🔙 Main Menu", callback_data: "main_menu" }],
          ]
        );
        return new Response("OK");
      }

      if (data === "upload_status") {
        const imgExisting = await getExistingMedia(sb, IMAGE_MODELS);
        const vidExisting = await getExistingMedia(sb, VIDEO_MODELS);
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `📊 *Upload Status*\n\n🖼 Images: ${imgExisting.size}/${IMAGE_MODELS.length} ✅\n🎬 Videos: ${vidExisting.size}/${VIDEO_MODELS.length} ✅`,
          [[{ text: "🔙 Upload Menu", callback_data: "upload_menu" }]]
        );
        return new Response("OK");
      }

      if (data === "page_images" || data === "page_videos") {
        const page = data === "page_images" ? "images" : "videos";
        const allModels = page === "images" ? IMAGE_MODELS : VIDEO_MODELS;
        const existing = await getExistingMedia(sb, allModels);
        const remaining = allModels.filter(m => !existing.has(m));

        if (remaining.length === 0) {
          await editOrSend(BOT_TOKEN, chatId, msgId,
            `✅ All ${page} models already have media!`,
            [[{ text: "🔙 Upload Menu", callback_data: "upload_menu" }]]
          );
          return new Response("OK");
        }

        const session: BotSession = { page, modelIndex: 0, models: remaining };
        await saveSession(sb, chatId, session);
        const modelId = remaining[0];
        const modelName = MODEL_NAMES[modelId] || modelId;

        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `*${page === "images" ? "📸 Image" : "🎬 Video"} Upload*\nRemaining: *${remaining.length}*\n\n🎯 Model: *${modelName}*\n\`${modelId}\`\n\nSend ${page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "⏭ Skip", callback_data: "skip_model" }, { text: "❌ Cancel", callback_data: "upload_menu" }],
            ],
          }),
        });
        return new Response("OK");
      }

      if (data === "skip_model") {
        const session = await loadSession(sb, chatId);
        if (!session?.models) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "No active session. Use /start" });
          return new Response("OK");
        }
        session.modelIndex = (session.modelIndex || 0) + 1;
        if (session.modelIndex >= session.models.length) {
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: "✅ All models done!",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Upload Menu", callback_data: "upload_menu" }]] }),
          });
          return new Response("OK");
        }
        await saveSession(sb, chatId, session);
        const modelId = session.models[session.modelIndex];
        const remaining = session.models.length - session.modelIndex;
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `⏭ Skipped.\n\nRemaining: *${remaining}*\n\n🎯 Model: *${MODEL_NAMES[modelId] || modelId}*\n\`${modelId}\`\n\nSend ${session.page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: "⏭ Skip", callback_data: "skip_model" }, { text: "❌ Cancel", callback_data: "upload_menu" }]],
          }),
        });
        return new Response("OK");
      }

      // ==== EDIT MODELS ====
      if (data === "edit_menu") {
        const cats = buildCategoryKeyboard("edit");
        cats.push([{ text: "🔙 Main Menu", callback_data: "main_menu" }]);
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "✏️ *Edit Models*\n\nChoose a category:",
          cats
        );
        return new Response("OK");
      }

      // Category selected for editing
      if (data.startsWith("cat_edit_")) {
        const catKey = data.replace("cat_edit_", "");
        const cat = CATEGORIES.find(c => c.key === catKey);
        if (!cat) return new Response("OK");

        const kb = buildModelListKeyboard(cat.models, 0, catKey, "emod");
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `✏️ *${cat.label}*\n\nSelect a model to edit:`,
          kb
        );
        return new Response("OK");
      }

      // Navigation for edit model list
      if (data.startsWith("nav_emod_")) {
        const parts = data.replace("nav_emod_", "").split("_");
        const catKey = parts[0];
        const page = parseInt(parts[1]) || 0;
        const cat = CATEGORIES.find(c => c.key === catKey);
        if (!cat) return new Response("OK");

        const kb = buildModelListKeyboard(cat.models, page, catKey, "emod");
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `✏️ *${cat.label}* — Page ${page + 1}`,
          kb
        );
        return new Response("OK");
      }

      if (data === "back_emod_cats") {
        const cats = buildCategoryKeyboard("edit");
        cats.push([{ text: "🔙 Main Menu", callback_data: "main_menu" }]);
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "✏️ *Edit Models*\n\nChoose a category:",
          cats
        );
        return new Response("OK");
      }

      // Model selected for editing
      if (data.startsWith("emod_")) {
        const modelId = data.replace("emod_", "");
        const config = await getModelConfig(sb, modelId);
        const name = config.name || MODEL_NAMES[modelId] || modelId;

        await saveSession(sb, chatId, { adminAction: "editing_model", adminModelId: modelId });

        const fieldRows = [];
        for (let i = 0; i < EDITABLE_FIELDS.length; i += 2) {
          const row: { text: string; callback_data: string }[] = [];
          const f1 = EDITABLE_FIELDS[i];
          const val1 = config[f1.key] || "—";
          row.push({ text: `${f1.label}: ${val1.length > 12 ? val1.slice(0, 12) + "…" : val1}`, callback_data: `efield_${f1.key}` });
          if (EDITABLE_FIELDS[i + 1]) {
            const f2 = EDITABLE_FIELDS[i + 1];
            const val2 = config[f2.key] || "—";
            row.push({ text: `${f2.label}: ${val2.length > 12 ? val2.slice(0, 12) + "…" : val2}`, callback_data: `efield_${f2.key}` });
          }
          fieldRows.push(row);
        }
        fieldRows.push([{ text: "🗑 Reset Config", callback_data: `reset_config_${modelId}` }]);
        fieldRows.push([{ text: "🔙 Back to List", callback_data: "edit_menu" }]);

        await editOrSend(BOT_TOKEN, chatId, msgId,
          `🔧 *${name}*\n📌 ID: \`${modelId}\`\n\n` +
          EDITABLE_FIELDS.map(f => `${f.label}: \`${config[f.key] || "default"}\``).join("\n") +
          "\n\nTap a field to edit:",
          fieldRows
        );
        return new Response("OK");
      }

      // Field selected for editing
      if (data.startsWith("efield_")) {
        const field = data.replace("efield_", "");
        const session = await loadSession(sb, chatId);
        if (!session?.adminModelId) return new Response("OK");

        const fieldLabel = EDITABLE_FIELDS.find(f => f.key === field)?.label || field;

        // For credits, show preset buttons
        if (field === "credits") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_field_value", adminField: field });
          const presetRows: { text: string; callback_data: string }[][] = [];
          const row1: { text: string; callback_data: string }[] = [];
          const row2: { text: string; callback_data: string }[] = [];
          MC_PRESETS.forEach((v, i) => {
            (i < 3 ? row1 : row2).push({ text: `${v} MC`, callback_data: `setval_credits_${v}` });
          });
          presetRows.push(row1, row2);
          presetRows.push([{ text: "✏️ Custom value", callback_data: "custom_credits" }]);
          presetRows.push([{ text: "🔙 Back", callback_data: `emod_${session.adminModelId}` }]);

          await editOrSend(BOT_TOKEN, chatId, msgId,
            `💰 *Set MC Cost* for \`${session.adminModelId}\`\n\nChoose a preset or enter custom:`,
            presetRows
          );
          return new Response("OK");
        }

        // For provider, show preset buttons
        if (field === "provider") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_field_value", adminField: field });
          await editOrSend(BOT_TOKEN, chatId, msgId,
            `🏷 *Set Provider* for \`${session.adminModelId}\`\n\nChoose provider:`,
            [
              [{ text: "fal.ai", callback_data: "setval_provider_fal" }, { text: "OpenRouter", callback_data: "setval_provider_openrouter" }],
              [{ text: "Internal", callback_data: "setval_provider_internal" }, { text: "Custom", callback_data: "setval_provider_custom" }],
              [{ text: "🔙 Back", callback_data: `emod_${session.adminModelId}` }],
            ]
          );
          return new Response("OK");
        }

        // For other fields, ask for text input
        await saveSession(sb, chatId, { ...session, adminAction: "awaiting_field_value", adminField: field });
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `${fieldLabel}\n\nEnter new value for \`${session.adminModelId}\`:`,
          [[{ text: "🔙 Cancel", callback_data: `emod_${session.adminModelId}` }]]
        );
        return new Response("OK");
      }

      // Preset value set
      if (data.startsWith("setval_")) {
        const parts = data.replace("setval_", "").split("_");
        const field = parts[0];
        const value = parts.slice(1).join("_");

        if (value === "custom") {
          // Ask for text input
          const session = await loadSession(sb, chatId);
          if (!session?.adminModelId) return new Response("OK");
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_field_value", adminField: field });
          await editOrSend(BOT_TOKEN, chatId, msgId,
            `✏️ Enter custom *${field}* value for \`${session.adminModelId}\`:`,
            [[{ text: "🔙 Cancel", callback_data: `emod_${session.adminModelId}` }]]
          );
          return new Response("OK");
        }

        const session = await loadSession(sb, chatId);
        if (!session?.adminModelId) return new Response("OK");

        const config = await getModelConfig(sb, session.adminModelId);
        config[field] = value;
        await setModelConfig(sb, session.adminModelId, config);

        const name = config.name || MODEL_NAMES[session.adminModelId] || session.adminModelId;
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `✅ *${name}*\n\nUpdated *${field}* → \`${value}\``,
          [
            [{ text: "✏️ Edit More", callback_data: `emod_${session.adminModelId}` }],
            [{ text: "🔙 Edit Menu", callback_data: "edit_menu" }],
          ]
        );
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // Reset config
      if (data.startsWith("reset_config_")) {
        const modelId = data.replace("reset_config_", "");
        await sb.from("memories").delete().eq("key", `model_config_${modelId}`);
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `🗑 Config reset for \`${modelId}\``,
          [
            [{ text: "✏️ Edit Again", callback_data: `emod_${modelId}` }],
            [{ text: "🔙 Edit Menu", callback_data: "edit_menu" }],
          ]
        );
        return new Response("OK");
      }

      // ==== USERS MANAGEMENT ====
      if (data === "users_menu") {
        // Show recent users with pagination
        await showUsersPage(sb, BOT_TOKEN, chatId, msgId, 0);
        return new Response("OK");
      }

      // Users pagination
      if (data.startsWith("users_page_")) {
        const page = parseInt(data.replace("users_page_", "")) || 0;
        await showUsersPage(sb, BOT_TOKEN, chatId, msgId, page);
        return new Response("OK");
      }

      // User selected
      if (data.startsWith("uview_")) {
        const userId = data.replace("uview_", "");
        const { data: profile } = await sb.from("profiles").select("*").eq("id", userId).single();
        if (!profile) {
          await editOrSend(BOT_TOKEN, chatId, msgId, "❌ User not found.", [[{ text: "🔙 Users", callback_data: "users_menu" }]]);
          return new Response("OK");
        }

        await saveSession(sb, chatId, { adminUserId: userId });
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `👤 *${profile.display_name || "User"}*\n\n` +
          `🆔 \`${profile.id}\`\n` +
          `💰 MC: *${Number(profile.credits).toFixed(1)}*\n` +
          `📋 Plan: *${profile.plan}*\n` +
          `📅 Joined: ${new Date(profile.created_at).toLocaleDateString()}`,
          [
            [{ text: "➕ Add MC", callback_data: `uadd_${userId}` }, { text: "➖ Remove MC", callback_data: `usub_${userId}` }],
            [{ text: "⭐ Set Plan", callback_data: `uplan_${userId}` }],
            [{ text: "🔙 Users", callback_data: "users_menu" }],
          ]
        );
        return new Response("OK");
      }

      // Add MC presets
      if (data.startsWith("uadd_")) {
        const userId = data.replace("uadd_", "");
        await saveSession(sb, chatId, { adminAction: "awaiting_mc_amount", adminUserId: userId });
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "➕ *Add MC*\n\nChoose amount:",
          [
            [{ text: "+5", callback_data: `mc_add_5_${userId}` }, { text: "+10", callback_data: `mc_add_10_${userId}` }, { text: "+25", callback_data: `mc_add_25_${userId}` }],
            [{ text: "+50", callback_data: `mc_add_50_${userId}` }, { text: "+100", callback_data: `mc_add_100_${userId}` }, { text: "+500", callback_data: `mc_add_500_${userId}` }],
            [{ text: "✏️ Custom", callback_data: `mc_custom_add_${userId}` }],
            [{ text: "🔙 Back", callback_data: `uview_${userId}` }],
          ]
        );
        return new Response("OK");
      }

      if (data.startsWith("usub_")) {
        const userId = data.replace("usub_", "");
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "➖ *Remove MC*\n\nChoose amount:",
          [
            [{ text: "-5", callback_data: `mc_sub_5_${userId}` }, { text: "-10", callback_data: `mc_sub_10_${userId}` }, { text: "-25", callback_data: `mc_sub_25_${userId}` }],
            [{ text: "-50", callback_data: `mc_sub_50_${userId}` }, { text: "-100", callback_data: `mc_sub_100_${userId}` }],
            [{ text: "✏️ Custom", callback_data: `mc_custom_sub_${userId}` }],
            [{ text: "🔙 Back", callback_data: `uview_${userId}` }],
          ]
        );
        return new Response("OK");
      }

      // MC preset applied
      if (data.startsWith("mc_add_") || data.startsWith("mc_sub_")) {
        const isAdd = data.startsWith("mc_add_");
        const rest = data.replace(isAdd ? "mc_add_" : "mc_sub_", "");
        const idx = rest.indexOf("_");
        const amount = parseInt(rest.slice(0, idx));
        const userId = rest.slice(idx + 1);
        const change = isAdd ? amount : -amount;

        await applyMcChange(sb, BOT_TOKEN, chatId, msgId, userId, change);
        return new Response("OK");
      }

      // Custom MC - ask for text input
      if (data.startsWith("mc_custom_add_") || data.startsWith("mc_custom_sub_")) {
        const isAdd = data.startsWith("mc_custom_add_");
        const userId = data.replace(isAdd ? "mc_custom_add_" : "mc_custom_sub_", "");
        await saveSession(sb, chatId, { adminAction: isAdd ? "awaiting_mc_add" : "awaiting_mc_sub", adminUserId: userId });
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `✏️ Enter ${isAdd ? "amount to add" : "amount to remove"}:`,
          [[{ text: "🔙 Cancel", callback_data: `uview_${userId}` }]]
        );
        return new Response("OK");
      }

      // Set plan
      if (data.startsWith("uplan_")) {
        const userId = data.replace("uplan_", "");
        await editOrSend(BOT_TOKEN, chatId, msgId,
          "⭐ *Set Plan*\n\nChoose plan:",
          [
            [{ text: "Free", callback_data: `setplan_free_${userId}` }, { text: "Starter", callback_data: `setplan_starter_${userId}` }],
            [{ text: "Pro", callback_data: `setplan_pro_${userId}` }, { text: "Elite", callback_data: `setplan_elite_${userId}` }],
            [{ text: "🔙 Back", callback_data: `uview_${userId}` }],
          ]
        );
        return new Response("OK");
      }

      if (data.startsWith("setplan_")) {
        const rest = data.replace("setplan_", "");
        const idx = rest.indexOf("_");
        const plan = rest.slice(0, idx);
        const userId = rest.slice(idx + 1);

        await sb.from("profiles").update({ plan }).eq("id", userId);
        const { data: profile } = await sb.from("profiles").select("display_name").eq("id", userId).single();
        await editOrSend(BOT_TOKEN, chatId, msgId,
          `✅ *${profile?.display_name || "User"}* plan set to *${plan}*`,
          [
            [{ text: "👤 View User", callback_data: `uview_${userId}` }],
            [{ text: "🔙 Users", callback_data: "users_menu" }],
          ]
        );
        return new Response("OK");
      }

      // ==== STATS ====
      if (data === "admin_stats") {
        const { count: userCount } = await sb.from("profiles").select("*", { count: "exact", head: true });
        const { count: convCount } = await sb.from("conversations").select("*", { count: "exact", head: true });
        const { count: msgCount } = await sb.from("messages").select("*", { count: "exact", head: true });
        const { count: projectCount } = await sb.from("projects").select("*", { count: "exact", head: true });
        const imgMedia = await getExistingMedia(sb, IMAGE_MODELS);
        const vidMedia = await getExistingMedia(sb, VIDEO_MODELS);

        await editOrSend(BOT_TOKEN, chatId, msgId,
          `📊 *System Stats*\n\n` +
          `👥 Users: *${userCount || 0}*\n` +
          `💬 Conversations: *${convCount || 0}*\n` +
          `📝 Messages: *${msgCount || 0}*\n` +
          `💻 Projects: *${projectCount || 0}*\n` +
          `🖼 Image Media: *${imgMedia.size}/${IMAGE_MODELS.length}*\n` +
          `🎬 Video Media: *${vidMedia.size}/${VIDEO_MODELS.length}*`,
          [[{ text: "🔙 Main Menu", callback_data: "main_menu" }]]
        );
        return new Response("OK");
      }

      return new Response("OK");
    }

    // ========================
    //   TEXT / MEDIA MESSAGES
    // ========================
    if (message) {
      const chatId = message.chat.id;
      const text = message.text;

      // /start
      if (text === "/start") {
        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "🤖 *Megsy Admin Bot*\n\nChoose an action:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "📸 Upload Media", callback_data: "upload_menu" }],
              [{ text: "🔧 Edit Models", callback_data: "edit_menu" }],
              [{ text: "👥 Users", callback_data: "users_menu" }],
              [{ text: "📊 Stats", callback_data: "admin_stats" }],
            ],
          }),
        });
        return new Response("OK");
      }

      const session = await loadSession(sb, chatId);

      // ---- Handle text input for field values ----
      if (session?.adminAction === "awaiting_field_value" && text && session.adminModelId && session.adminField) {
        const config = await getModelConfig(sb, session.adminModelId);
        config[session.adminField] = text.trim();
        await setModelConfig(sb, session.adminModelId, config);

        const name = config.name || MODEL_NAMES[session.adminModelId] || session.adminModelId;
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ *${name}*\n\nUpdated *${session.adminField}* → \`${text.trim()}\``,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "✏️ Edit More", callback_data: `emod_${session.adminModelId}` }],
              [{ text: "🔙 Edit Menu", callback_data: "edit_menu" }],
            ],
          }),
        });
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // ---- Handle MC custom amount ----
      if ((session?.adminAction === "awaiting_mc_add" || session?.adminAction === "awaiting_mc_sub") && text && session.adminUserId) {
        const amount = parseFloat(text.trim());
        if (isNaN(amount) || amount <= 0) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "❌ Enter a valid positive number:" });
          return new Response("OK");
        }
        const change = session.adminAction === "awaiting_mc_add" ? amount : -amount;
        await applyMcChange(sb, BOT_TOKEN, chatId, undefined, session.adminUserId, change);
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // ---- Handle photo/video upload for media management ----
      if (session?.page && session.models) {
        const currentModelId = session.models[session.modelIndex || 0];
        const currentModelName = MODEL_NAMES[currentModelId] || currentModelId;
        let fileId: string | null = null;
        let mediaType: "image" | "video" = "image";

        if (message.photo?.length > 0) {
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
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: "Send an image or video only.",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "⏭ Skip", callback_data: "skip_model" }, { text: "❌ Cancel", callback_data: "upload_menu" }]] }),
          });
          return new Response("OK");
        }

        const fileInfo = await tg(BOT_TOKEN, "getFile", { file_id: fileId });
        const filePath = fileInfo.result?.file_path;
        if (!filePath) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "Failed to download file." });
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
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `Upload error: ${uploadError.message}` });
          return new Response("OK");
        }

        const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
        await sb.from("model_media").upsert({
          model_id: currentModelId, media_url: urlData.publicUrl, media_type: mediaType, updated_at: new Date().toISOString(),
        }, { onConflict: "model_id" });

        session.modelIndex = (session.modelIndex || 0) + 1;
        const remaining = session.models.length - session.modelIndex;

        if (remaining === 0) {
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ Uploaded for *${currentModelName}*\n\nAll models done!`, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 Upload Menu", callback_data: "upload_menu" }]] }),
          });
          return new Response("OK");
        }

        await saveSession(sb, chatId, session);
        const nextModelId = session.models[session.modelIndex];

        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ *${currentModelName}* done!\n\nRemaining: *${remaining}*\n\n🎯 Next: *${MODEL_NAMES[nextModelId] || nextModelId}*\n\`${nextModelId}\`\n\nSend ${session.page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: "⏭ Skip", callback_data: "skip_model" }, { text: "❌ Cancel", callback_data: "upload_menu" }]],
          }),
        });
        return new Response("OK");
      }

      // Default
      await tg(BOT_TOKEN, "sendMessage", {
        chat_id: chatId, text: "Press /start to begin.",
        reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🚀 Start", callback_data: "main_menu" }]] }),
      });
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

// ---- Helper functions ----

async function showUsersPage(sb: ReturnType<typeof createClient>, token: string, chatId: number, msgId: number | undefined, page: number) {
  const from = page * USERS_PER_PAGE;
  const { data: users, count } = await sb.from("profiles")
    .select("id, display_name, credits, plan, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + USERS_PER_PAGE - 1);

  const total = count || 0;
  const totalPages = Math.ceil(total / USERS_PER_PAGE) || 1;

  if (!users || users.length === 0) {
    await editOrSend(token, chatId, msgId, "No users found.", [[{ text: "🔙 Main Menu", callback_data: "main_menu" }]]);
    return;
  }

  const rows: { text: string; callback_data: string }[][] = users.map(u => [{
    text: `${u.display_name || "User"} — ${Number(u.credits).toFixed(0)} MC (${u.plan})`,
    callback_data: `uview_${u.id}`,
  }]);

  // Pagination
  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) navRow.push({ text: "◀️ Prev", callback_data: `users_page_${page - 1}` });
  navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) navRow.push({ text: "Next ▶️", callback_data: `users_page_${page + 1}` });
  rows.push(navRow);
  rows.push([{ text: "🔙 Main Menu", callback_data: "main_menu" }]);

  await editOrSend(token, chatId, msgId,
    `👥 *Users* (${total} total)\n\nSelect a user:`,
    rows
  );
}

async function applyMcChange(sb: ReturnType<typeof createClient>, token: string, chatId: number, msgId: number | undefined, userId: string, change: number) {
  const { data: profile } = await sb.from("profiles").select("credits, display_name").eq("id", userId).single();
  if (!profile) {
    await editOrSend(token, chatId, msgId, "❌ User not found.", [[{ text: "🔙 Users", callback_data: "users_menu" }]]);
    return;
  }

  const newCredits = Math.max(0, Number(profile.credits) + change);
  await sb.from("profiles").update({ credits: newCredits }).eq("id", userId);
  await sb.from("credit_transactions").insert({
    user_id: userId,
    amount: Math.abs(change),
    action_type: change >= 0 ? "admin_add" : "admin_deduct",
    description: `Admin: ${change >= 0 ? "+" : ""}${change} MC`,
  });

  await editOrSend(token, chatId, msgId,
    `✅ *${profile.display_name || "User"}*\n\n` +
    `Previous: ${Number(profile.credits).toFixed(1)} MC\n` +
    `Change: ${change >= 0 ? "+" : ""}${change}\n` +
    `New: ${newCredits.toFixed(1)} MC`,
    [
      [{ text: "👤 View User", callback_data: `uview_${userId}` }],
      [{ text: "🔙 Users", callback_data: "users_menu" }],
    ]
  );
}
