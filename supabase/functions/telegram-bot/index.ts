import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  "fal-flux-realism": "FLUX Realism", "logo-creator": "صانع الشعارات", "sticker-maker": "صانع الملصقات",
  "qr-art": "QR فني", "nano-banana-edit": "Nano Banana Edit", "object-remover": "حذف العناصر",
  "watermark-remover": "حذف العلامة المائية", "image-extender": "توسيع الصورة",
  "flux-pro-editor": "FLUX Pro Editor", "image-variations": "تنويعات الصورة",
  "photo-colorizer": "تلوين الصور", "bg-remover": "حذف الخلفية", "4k-upscaler": "تكبير 4K",
  "face-enhancer": "تحسين الوجه", "creative-upscaler": "تكبير إبداعي",
  "old-photo-restorer": "ترميم الصور القديمة", "bg-replacer": "تغيير الخلفية",
  "style-transfer": "نقل الأسلوب", "ai-relighting": "إضاءة ذكية",
  "photo-to-cartoon": "صورة لكرتون", "product-photo": "صور المنتجات", "ai-headshot": "صور شخصية AI",
  "megsy-video": "Megsy Video", "veo-3.1": "Google Veo 3.1", "veo-3.1-fast": "Veo 3.1 سريع",
  "kling-3-pro": "Kling 3.0 Pro", "kling-o1": "Kling O1", "openai-sora": "OpenAI Sora",
  "pika-2.2": "Pika 2.2", "luma-dream": "Luma Dream", "seedance-pro": "Seedance Pro",
  "wan-2.6": "WAN 2.6", "pixverse-5.5": "PixVerse v5.5", "megsy-video-i2v": "Megsy Video I2V",
  "kling-3-pro-i2v": "Kling 3.0 Pro I2V", "kling-o1-i2v": "Kling O1 I2V",
  "veo-3.1-fast-i2v": "Veo 3.1 سريع I2V", "openai-sora-i2v": "Sora I2V",
  "pixverse-5.5-i2v": "PixVerse I2V", "wan-2.6-i2v": "WAN 2.6 I2V",
  "wan-flf": "WAN أول-آخر إطار", "kling-avatar-pro": "Kling Avatar Pro",
  "kling-avatar-std": "Kling Avatar Std", "sadtalker": "SadTalker", "sync-lipsync": "Sync Lipsync V2",
  "google/gemini-3-flash-preview": "Megsy V1 (محادثة)", "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "openai/gpt-5": "GPT-5", "x-ai/grok-3": "Grok 3", "deepseek/deepseek-r1": "DeepSeek R1",
};

const CATEGORIES = [
  { key: "images", label: "نماذج الصور", emoji: "🖼", models: IMAGE_MODELS },
  { key: "videos", label: "نماذج الفيديو", emoji: "🎬", models: VIDEO_MODELS },
  { key: "chat", label: "نماذج المحادثة", emoji: "💬", models: CHAT_MODELS },
  { key: "code", label: "نماذج البرمجة", emoji: "💻", models: CODE_MODELS },
];

const PER_PAGE = 6;
const USERS_PER_PAGE = 8;

const FIELDS = [
  { key: "name", label: "الاسم" },
  { key: "credits", label: "التكلفة (MC)" },
  { key: "description", label: "الوصف" },
  { key: "type", label: "النوع" },
  { key: "speed", label: "السرعة" },
  { key: "quality", label: "الجودة" },
  { key: "requiresImage", label: "يتطلب صورة" },
  { key: "maxImages", label: "أقصى عدد صور" },
  { key: "fal_id", label: "معرف fal.ai" },
  { key: "openrouter_id", label: "معرف OpenRouter" },
  { key: "provider", label: "المزود" },
  { key: "capabilities", label: "القدرات" },
];

const MC_PRESETS = [5, 10, 25, 50, 100, 500];

const SHOWCASE_ASPECTS = ["1:1", "2:3", "3:2", "4:3", "16:9", "9:16", "4:5"];
const SHOWCASE_QUALITIES = ["1K", "2K", "4K", "8K"];

// Capabilities for selection-based editing
const CAPABILITY_OPTIONS = [
  { key: "text-to-image", label: "نص → صورة" },
  { key: "image-to-image", label: "صورة → صورة" },
  { key: "multi-image", label: "عدة صور" },
  { key: "inpainting", label: "Inpainting" },
  { key: "outpainting", label: "Outpainting" },
  { key: "upscale", label: "تكبير" },
  { key: "remove-bg", label: "حذف الخلفية" },
  { key: "style-transfer", label: "نقل الأسلوب" },
  { key: "face-enhance", label: "تحسين الوجه" },
  { key: "colorize", label: "تلوين" },
  { key: "restore", label: "ترميم" },
  { key: "text-to-video", label: "نص → فيديو" },
  { key: "image-to-video", label: "صورة → فيديو" },
  { key: "avatar", label: "أفاتار" },
  { key: "lipsync", label: "Lipsync" },
  { key: "editing", label: "تعديل/Edit" },
  { key: "logo", label: "شعارات" },
  { key: "sticker", label: "ملصقات" },
  { key: "qr", label: "QR فني" },
  { key: "product-photo", label: "صور منتجات" },
];

const FAL_PREFIXES = [
  { label: "fal-ai/", value: "fal-ai/" },
  { label: "fal-ai/flux/", value: "fal-ai/flux/" },
  { label: "fal-ai/stable-diffusion/", value: "fal-ai/stable-diffusion/" },
  { label: "fal-ai/wan/", value: "fal-ai/wan/" },
  { label: "fal-ai/kling/", value: "fal-ai/kling/" },
];

interface BotSession {
  page?: "images" | "videos";
  modelIndex?: number;
  models?: string[];
  adminAction?: string;
  adminModelId?: string;
  adminField?: string;
  adminUserId?: string;
  oauthStep?: string;
  oauthAppName?: string;
  oauthAppId?: string;
  // Showcase session fields
  showcaseStep?: string;
  showcaseMediaUrl?: string;
  showcaseMediaType?: string;
  showcasePrompt?: string;
  showcaseModelId?: string;
  showcaseModelName?: string;
  showcaseAspect?: string;
  showcaseQuality?: string;
  showcaseDuration?: string;
  showcaseStyle?: string;
  showcaseItemId?: string;
  // Add model flow
  addModelStep?: string;
  addModelData?: Record<string, string>;
}

// ---- Helpers ----
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

async function send(token: string, chatId: number, msgId: number | undefined, text: string, keyboard: unknown[][], parse_mode = "Markdown") {
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

function modelListKB(models: string[], page: number, catKey: string, prefix: string) {
  const start = page * PER_PAGE;
  const slice = models.slice(start, start + PER_PAGE);
  const total = Math.ceil(models.length / PER_PAGE);
  const rows: { text: string; callback_data: string }[][] = [];

  for (let i = 0; i < slice.length; i += 2) {
    const row: { text: string; callback_data: string }[] = [];
    row.push({ text: MODEL_NAMES[slice[i]] || slice[i], callback_data: `${prefix}_${slice[i]}` });
    if (slice[i + 1]) row.push({ text: MODEL_NAMES[slice[i + 1]] || slice[i + 1], callback_data: `${prefix}_${slice[i + 1]}` });
    rows.push(row);
  }

  const nav: { text: string; callback_data: string }[] = [];
  if (page > 0) nav.push({ text: "◀️ السابق", callback_data: `nav_${prefix}_${catKey}_${page - 1}` });
  nav.push({ text: `${page + 1}/${total}`, callback_data: "noop" });
  if (page < total - 1) nav.push({ text: "التالي ▶️", callback_data: `nav_${prefix}_${catKey}_${page + 1}` });
  rows.push(nav);
  rows.push([{ text: "🔙 رجوع", callback_data: `back_${prefix}_cats` }]);
  return rows;
}

function catsKB(prefix: string) {
  return CATEGORIES.map(c => [{
    text: `${c.emoji} ${c.label} (${c.models.length})`,
    callback_data: `cat_${prefix}_${c.key}`,
  }]);
}

// ---- OAuth Helpers ----
function generateId(len = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (const b of arr) result += chars[b % chars.length];
  return result;
}

async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---- Main Menu ----
function mainMenuKB() {
  return [
    [{ text: "📸 رفع الوسائط", callback_data: "upload_menu" }],
    [{ text: "✏️ تعديل النماذج", callback_data: "edit_menu" }],
    [{ text: "👥 إدارة المستخدمين", callback_data: "users_menu" }],
    [{ text: "🔑 OAuth Apps", callback_data: "oauth_menu" }],
    [{ text: "🎨 معرض العرض (Showcase)", callback_data: "showcase_menu" }],
    [{ text: "⚙️ إعدادات الصفحات", callback_data: "pagesettings_menu" }],
    [{ text: "📊 الإحصائيات", callback_data: "stats" }],
  ];
}

// ---- Page Settings Defaults ----
const DEFAULT_PAGE_IMAGES = {
  styles: ["none", "dynamic", "cinematic", "creative", "fashion", "portrait", "stock-photo", "vibrant", "anime", "3d-render"],
  aspectRatios: ["2:3", "1:1", "16:9"],
  maxImages: 4,
  defaultStyle: "dynamic",
  defaultAspect: "1:1",
  defaultNumImages: 1,
};

const DEFAULT_PAGE_VIDEOS = {
  aspectRatios: ["9:16", "16:9", "1:1", "4:3"],
  durations: [4, 5, 6, 8, 10],
  resolutions: ["720p", "1080p", "2K", "4K"],
  defaultAspect: "16:9",
  defaultDuration: 5,
  defaultResolution: "1080p",
};

async function getPageSettings(sb: ReturnType<typeof createClient>, page: "images" | "videos") {
  const defaults = page === "images" ? DEFAULT_PAGE_IMAGES : DEFAULT_PAGE_VIDEOS;
  const { data } = await sb.from("memories").select("value").eq("key", `page_settings_${page}`).maybeSingle();
  if (!data) return { ...defaults };
  try { return { ...defaults, ...JSON.parse(data.value) }; } catch { return { ...defaults }; }
}

async function savePageSettings(sb: ReturnType<typeof createClient>, page: "images" | "videos", settings: Record<string, unknown>) {
  await sb.from("memories").delete().eq("key", `page_settings_${page}`);
  await sb.from("memories").insert({ key: `page_settings_${page}`, value: JSON.stringify(settings) });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!BOT_TOKEN) return new Response("missing token", { status: 500 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const update = await req.json();
    const message = update.message;
    const callback = update.callback_query;

    // ==================== CALLBACKS ====================
    if (callback) {
      const chatId = callback.message.chat.id;
      const msgId = callback.message.message_id;
      const d = callback.data;
      await tg(BOT_TOKEN, "answerCallbackQuery", { callback_query_id: callback.id });

      if (d === "noop") return new Response("OK");

      // ---- القائمة الرئيسية ----
      if (d === "main_menu") {
        await clearSession(sb, chatId);
        await send(BOT_TOKEN, chatId, msgId, "🤖 *لوحة تحكم Megsy*\n\nاختر عملية:", mainMenuKB());
        return new Response("OK");
      }

      // ==================== رفع الوسائط ====================
      if (d === "upload_menu") {
        await send(BOT_TOKEN, chatId, msgId, "📤 *رفع الوسائط*\n\nاختر القسم:", [
          [{ text: "🖼 نماذج الصور", callback_data: "page_images" }, { text: "🎬 نماذج الفيديو", callback_data: "page_videos" }],
          [{ text: "📊 حالة الرفع", callback_data: "upload_status" }],
          [{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }],
        ]);
        return new Response("OK");
      }

      if (d === "upload_status") {
        const imgEx = await getExistingMedia(sb, IMAGE_MODELS);
        const vidEx = await getExistingMedia(sb, VIDEO_MODELS);
        await send(BOT_TOKEN, chatId, msgId,
          `📊 *حالة الرفع*\n\n🖼 الصور: ${imgEx.size}/${IMAGE_MODELS.length} ✅\n🎬 الفيديو: ${vidEx.size}/${VIDEO_MODELS.length} ✅`,
          [[{ text: "🔙 رجوع", callback_data: "upload_menu" }]]
        );
        return new Response("OK");
      }

      if (d === "page_images" || d === "page_videos") {
        const pg = d === "page_images" ? "images" : "videos";
        const all = pg === "images" ? IMAGE_MODELS : VIDEO_MODELS;
        const existing = await getExistingMedia(sb, all);
        const remaining = all.filter(m => !existing.has(m));

        if (remaining.length === 0) {
          await send(BOT_TOKEN, chatId, msgId, `✅ كل نماذج ${pg === "images" ? "الصور" : "الفيديو"} لديها وسائط بالفعل!`, [[{ text: "🔙 رجوع", callback_data: "upload_menu" }]]);
          return new Response("OK");
        }

        const session: BotSession = { page: pg, modelIndex: 0, models: remaining };
        await saveSession(sb, chatId, session);
        const modelId = remaining[0];
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `*رفع ${pg === "images" ? "الصور 🖼" : "الفيديو 🎬"}*\nالمتبقي: *${remaining.length}*\n\n🎯 النموذج: *${MODEL_NAMES[modelId] || modelId}*\n\`${modelId}\`\n\nأرسل ${pg === "images" ? "صورة" : "فيديو"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [
            [{ text: "⏭ تخطي", callback_data: "skip_model" }, { text: "❌ إلغاء", callback_data: "upload_menu" }],
          ]}),
        });
        return new Response("OK");
      }

      if (d === "skip_model") {
        const session = await loadSession(sb, chatId);
        if (!session?.models) { await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "لا توجد جلسة نشطة. اضغط /start" }); return new Response("OK"); }
        session.modelIndex = (session.modelIndex || 0) + 1;
        if (session.modelIndex >= session.models.length) {
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "✅ تم الانتهاء من كل النماذج!", reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 رجوع", callback_data: "upload_menu" }]] }) });
          return new Response("OK");
        }
        await saveSession(sb, chatId, session);
        const mid = session.models[session.modelIndex];
        const rem = session.models.length - session.modelIndex;
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `⏭ تم التخطي\n\nالمتبقي: *${rem}*\n\n🎯 النموذج: *${MODEL_NAMES[mid] || mid}*\n\`${mid}\`\n\nأرسل ${session.page === "images" ? "صورة" : "فيديو"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "skip_model" }, { text: "❌ إلغاء", callback_data: "upload_menu" }]] }),
        });
        return new Response("OK");
      }

      // ==================== تعديل النماذج ====================
      if (d === "edit_menu") {
        const kb = catsKB("edit");
        kb.push([{ text: "➕ إضافة نموذج جديد", callback_data: "add_model" }]);
        kb.push([{ text: "👁 النماذج المخفية", callback_data: "hidden_models" }]);
        kb.push([{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }]);
        await send(BOT_TOKEN, chatId, msgId, "✏️ *تعديل النماذج*\n\nاختر القسم:", kb);
        return new Response("OK");
      }

      if (d.startsWith("cat_edit_")) {
        const catKey = d.replace("cat_edit_", "");
        const cat = CATEGORIES.find(c => c.key === catKey);
        if (!cat) return new Response("OK");
        await send(BOT_TOKEN, chatId, msgId, `✏️ *${cat.emoji} ${cat.label}*\n\nاختر نموذج للتعديل:`, modelListKB(cat.models, 0, catKey, "emod"));
        return new Response("OK");
      }

      if (d.startsWith("nav_emod_")) {
        const parts = d.replace("nav_emod_", "").split("_");
        const catKey = parts[0];
        const page = parseInt(parts[1]) || 0;
        const cat = CATEGORIES.find(c => c.key === catKey);
        if (!cat) return new Response("OK");
        await send(BOT_TOKEN, chatId, msgId, `✏️ *${cat.emoji} ${cat.label}* — صفحة ${page + 1}`, modelListKB(cat.models, page, catKey, "emod"));
        return new Response("OK");
      }

      if (d === "back_emod_cats") {
        const kb = catsKB("edit");
        kb.push([{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }]);
        await send(BOT_TOKEN, chatId, msgId, "✏️ *تعديل النماذج*\n\nاختر القسم:", kb);
        return new Response("OK");
      }

      // نموذج مختار للتعديل
      if (d.startsWith("emod_")) {
        const modelId = d.replace("emod_", "");
        const config = await getModelConfig(sb, modelId);
        const name = config.name || MODEL_NAMES[modelId] || modelId;
        await saveSession(sb, chatId, { adminAction: "editing", adminModelId: modelId });

        const fieldRows: { text: string; callback_data: string }[][] = [];
        for (let i = 0; i < FIELDS.length; i += 2) {
          const row: { text: string; callback_data: string }[] = [];
          const f1 = FIELDS[i];
          const v1 = config[f1.key] || "—";
          row.push({ text: `${f1.label}: ${v1.length > 10 ? v1.slice(0, 10) + "…" : v1}`, callback_data: `ef_${f1.key}` });
          if (FIELDS[i + 1]) {
            const f2 = FIELDS[i + 1];
            const v2 = config[f2.key] || "—";
            row.push({ text: `${f2.label}: ${v2.length > 10 ? v2.slice(0, 10) + "…" : v2}`, callback_data: `ef_${f2.key}` });
          }
          fieldRows.push(row);
        }
        fieldRows.push([{ text: "🗑 إعادة ضبط", callback_data: `reset_${modelId}` }, { text: "🚫 إخفاء النموذج", callback_data: `hide_${modelId}` }]);
        fieldRows.push([{ text: "🔙 رجوع", callback_data: "edit_menu" }]);

        await send(BOT_TOKEN, chatId, msgId,
          `🔧 *${name}*\n📌 \`${modelId}\`\n\n` +
          FIELDS.map(f => `${f.label}: \`${config[f.key] || "افتراضي"}\``).join("\n") +
          "\n\nاضغط على الحقل للتعديل:",
          fieldRows
        );
        return new Response("OK");
      }

      // حقل مختار للتعديل
      if (d.startsWith("ef_")) {
        const field = d.replace("ef_", "");
        const session = await loadSession(sb, chatId);
        if (!session?.adminModelId) return new Response("OK");
        const fieldLabel = FIELDS.find(f => f.key === field)?.label || field;

        if (field === "credits") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `💰 *تحديد تكلفة MC* لـ \`${session.adminModelId}\`\n\nاختر قيمة أو أدخل يدوياً:`, [
            [{ text: "1", callback_data: "sv_credits_1" }, { text: "2", callback_data: "sv_credits_2" }, { text: "3", callback_data: "sv_credits_3" }],
            [{ text: "4", callback_data: "sv_credits_4" }, { text: "5", callback_data: "sv_credits_5" }, { text: "6", callback_data: "sv_credits_6" }],
            [{ text: "8", callback_data: "sv_credits_8" }, { text: "10", callback_data: "sv_credits_10" }, { text: "15", callback_data: "sv_credits_15" }],
            [{ text: "20", callback_data: "sv_credits_20" }, { text: "30", callback_data: "sv_credits_30" }, { text: "50", callback_data: "sv_credits_50" }],
            [{ text: "✏️ قيمة مخصصة", callback_data: "sv_credits_custom" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        if (field === "type") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `📦 *نوع النموذج* لـ \`${session.adminModelId}\`:`, [
            [{ text: "🖼 image", callback_data: "sv_type_image" }, { text: "🔧 image-tool", callback_data: "sv_type_image-tool" }],
            [{ text: "🎬 video", callback_data: "sv_type_video" }, { text: "🎬 video-i2v", callback_data: "sv_type_video-i2v" }],
            [{ text: "💬 chat", callback_data: "sv_type_chat" }, { text: "👤 video-avatar", callback_data: "sv_type_video-avatar" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        if (field === "speed") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `⚡ *سرعة النموذج* لـ \`${session.adminModelId}\`:`, [
            [{ text: "⚡ fast", callback_data: "sv_speed_fast" }, { text: "🔄 standard", callback_data: "sv_speed_standard" }, { text: "🐢 slow", callback_data: "sv_speed_slow" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        if (field === "quality") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `🎯 *جودة النموذج* لـ \`${session.adminModelId}\`:`, [
            [{ text: "📊 standard", callback_data: "sv_quality_standard" }, { text: "✨ high", callback_data: "sv_quality_high" }, { text: "👑 ultra", callback_data: "sv_quality_ultra" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        if (field === "requiresImage") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `📸 *يتطلب صورة؟* لـ \`${session.adminModelId}\`:`, [
            [{ text: "✅ نعم", callback_data: "sv_requiresImage_true" }, { text: "❌ لا", callback_data: "sv_requiresImage_false" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        if (field === "maxImages") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `🔢 *أقصى عدد صور* لـ \`${session.adminModelId}\`:`, [
            [{ text: "0", callback_data: "sv_maxImages_0" }, { text: "1", callback_data: "sv_maxImages_1" }, { text: "2", callback_data: "sv_maxImages_2" }, { text: "4", callback_data: "sv_maxImages_4" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        if (field === "provider") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `🏷 *تحديد المزود* لـ \`${session.adminModelId}\`:`, [
            [{ text: "fal.ai", callback_data: "sv_provider_fal" }, { text: "OpenRouter", callback_data: "sv_provider_openrouter" }],
            [{ text: "داخلي", callback_data: "sv_provider_internal" }, { text: "مخصص", callback_data: "sv_provider_custom" }],
            [{ text: "🔙 رجوع", callback_data: `emod_${session.adminModelId}` }],
          ]);
          return new Response("OK");
        }

        await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
        await send(BOT_TOKEN, chatId, msgId, `✏️ ${fieldLabel}\n\nأدخل القيمة الجديدة لـ \`${session.adminModelId}\`:`, [[{ text: "🔙 إلغاء", callback_data: `emod_${session.adminModelId}` }]]);
        return new Response("OK");
      }

      // تعيين قيمة
      if (d.startsWith("sv_")) {
        const parts = d.replace("sv_", "").split("_");
        const field = parts[0];
        const value = parts.slice(1).join("_");
        const session = await loadSession(sb, chatId);
        if (!session?.adminModelId) return new Response("OK");

        if (value === "custom") {
          await saveSession(sb, chatId, { ...session, adminAction: "awaiting_value", adminField: field });
          await send(BOT_TOKEN, chatId, msgId, `✏️ أدخل قيمة مخصصة لـ *${field}*:`, [[{ text: "🔙 إلغاء", callback_data: `emod_${session.adminModelId}` }]]);
          return new Response("OK");
        }

        const config = await getModelConfig(sb, session.adminModelId);
        config[field] = value;
        await setModelConfig(sb, session.adminModelId, config);
        await send(BOT_TOKEN, chatId, msgId, `✅ تم تحديث *${field}* → \`${value}\``, [
          [{ text: "✏️ تعديل المزيد", callback_data: `emod_${session.adminModelId}` }],
          [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
        ]);
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // إعادة ضبط
      if (d.startsWith("reset_")) {
        const modelId = d.replace("reset_", "");
        await sb.from("memories").delete().eq("key", `model_config_${modelId}`);
        await send(BOT_TOKEN, chatId, msgId, `🗑 تم إعادة ضبط \`${modelId}\``, [
          [{ text: "✏️ تعديل", callback_data: `emod_${modelId}` }],
          [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
        ]);
        return new Response("OK");
      }

      // ==================== إخفاء نموذج ====================
      if (d.startsWith("hide_")) {
        const modelId = d.replace("hide_", "");
        const { data: hiddenData } = await sb.from("memories").select("value").eq("key", "models_hidden").maybeSingle();
        const hidden: string[] = hiddenData?.value ? JSON.parse(hiddenData.value) : [];
        if (!hidden.includes(modelId)) hidden.push(modelId);
        await sb.from("memories").delete().eq("key", "models_hidden");
        await sb.from("memories").insert({ key: "models_hidden", value: JSON.stringify(hidden) });
        await send(BOT_TOKEN, chatId, msgId, `🚫 تم إخفاء النموذج \`${modelId}\`\n\nلن يظهر للمستخدمين.`, [
          [{ text: "👁 النماذج المخفية", callback_data: "hidden_models" }],
          [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
        ]);
        return new Response("OK");
      }

      // عرض النماذج المخفية
      if (d === "hidden_models") {
        const { data: hiddenData } = await sb.from("memories").select("value").eq("key", "models_hidden").maybeSingle();
        const hidden: string[] = hiddenData?.value ? JSON.parse(hiddenData.value) : [];
        if (hidden.length === 0) {
          await send(BOT_TOKEN, chatId, msgId, "👁 لا توجد نماذج مخفية.", [
            [{ text: "🔙 رجوع", callback_data: "edit_menu" }],
          ]);
          return new Response("OK");
        }
        const rows = hidden.map(id => [{
          text: `${MODEL_NAMES[id] || id}`,
          callback_data: `unhide_${id}`,
        }]);
        rows.push([{ text: "🗑 إظهار الكل", callback_data: "unhide_all" }]);
        rows.push([{ text: "🔙 رجوع", callback_data: "edit_menu" }]);
        await send(BOT_TOKEN, chatId, msgId, `👁 *النماذج المخفية (${hidden.length})*\n\nاضغط على النموذج لإظهاره:`, rows);
        return new Response("OK");
      }

      if (d.startsWith("unhide_")) {
        const val = d.replace("unhide_", "");
        const { data: hiddenData } = await sb.from("memories").select("value").eq("key", "models_hidden").maybeSingle();
        let hidden: string[] = hiddenData?.value ? JSON.parse(hiddenData.value) : [];
        if (val === "all") {
          hidden = [];
        } else {
          hidden = hidden.filter(id => id !== val);
        }
        await sb.from("memories").delete().eq("key", "models_hidden");
        if (hidden.length > 0) {
          await sb.from("memories").insert({ key: "models_hidden", value: JSON.stringify(hidden) });
        }
        await send(BOT_TOKEN, chatId, msgId, val === "all" ? "✅ تم إظهار كل النماذج." : `✅ تم إظهار النموذج \`${val}\`.`, [
          [{ text: "👁 النماذج المخفية", callback_data: "hidden_models" }],
          [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
        ]);
        return new Response("OK");
      }

      // ==================== إضافة نموذج جديد ====================
      if (d === "add_model") {
        await saveSession(sb, chatId, { addModelStep: "awaiting_id", addModelData: {} });
        await send(BOT_TOKEN, chatId, msgId, "➕ *إضافة نموذج جديد*\n\n📌 الخطوة 1/5: أدخل معرف النموذج (ID):\n\nمثال: `my-new-model`", [
          [{ text: "🔙 إلغاء", callback_data: "edit_menu" }],
        ]);
        return new Response("OK");
      }

      // Select type for new model
      if (d.startsWith("am_type_")) {
        const type = d.replace("am_type_", "");
        const session = await loadSession(sb, chatId);
        if (!session?.addModelData) return new Response("OK");
        session.addModelData.type = type;
        session.addModelStep = "awaiting_credits";
        await saveSession(sb, chatId, session);
        await send(BOT_TOKEN, chatId, msgId, `✅ النوع: *${type}*\n\n💰 الخطوة 4/5: أدخل تكلفة MC:`, [
          [{ text: "1", callback_data: "am_cr_1" }, { text: "2", callback_data: "am_cr_2" }, { text: "3", callback_data: "am_cr_3" }],
          [{ text: "4", callback_data: "am_cr_4" }, { text: "5", callback_data: "am_cr_5" }, { text: "8", callback_data: "am_cr_8" }],
          [{ text: "10", callback_data: "am_cr_10" }, { text: "15", callback_data: "am_cr_15" }, { text: "20", callback_data: "am_cr_20" }],
          [{ text: "✏️ مخصص", callback_data: "am_cr_custom" }],
          [{ text: "🔙 إلغاء", callback_data: "edit_menu" }],
        ]);
        return new Response("OK");
      }

      // Set credits for new model
      if (d.startsWith("am_cr_")) {
        const val = d.replace("am_cr_", "");
        const session = await loadSession(sb, chatId);
        if (!session?.addModelData) return new Response("OK");
        if (val === "custom") {
          session.addModelStep = "awaiting_credits_text";
          await saveSession(sb, chatId, session);
          await send(BOT_TOKEN, chatId, msgId, "💰 أدخل تكلفة MC يدوياً:", [[{ text: "🔙 إلغاء", callback_data: "edit_menu" }]]);
          return new Response("OK");
        }
        session.addModelData.credits = val;
        session.addModelStep = "awaiting_description";
        await saveSession(sb, chatId, session);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId, text: `✅ التكلفة: *${val} MC*\n\n📝 الخطوة 5/5: أدخل وصف النموذج:`, parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "am_save" }], [{ text: "🔙 إلغاء", callback_data: "edit_menu" }]] }),
        });
        return new Response("OK");
      }

      // Save new model
      if (d === "am_save") {
        const session = await loadSession(sb, chatId);
        if (!session?.addModelData?.id) return new Response("OK");
        const md = session.addModelData;

        // Load existing added models
        const { data: addedData } = await sb.from("memories").select("value").eq("key", "models_added").maybeSingle();
        const added: Record<string, unknown>[] = addedData?.value ? JSON.parse(addedData.value) : [];

        added.push({
          id: md.id, name: md.name || md.id, type: md.type || "image",
          credits: Number(md.credits) || 0, description: md.description || "",
          longDescription: md.description || "", icon: "Image",
          modes: ["text-to-image"], acceptsImages: false, requiresImage: false,
          maxImages: 0, acceptedMimeTypes: [], provider: "Megsy",
          speed: "standard", quality: "high",
        });

        await sb.from("memories").delete().eq("key", "models_added");
        await sb.from("memories").insert({ key: "models_added", value: JSON.stringify(added) });
        await clearSession(sb, chatId);

        await send(BOT_TOKEN, chatId, msgId,
          `✅ *تم إضافة النموذج بنجاح!*\n\n📌 ID: \`${md.id}\`\n📛 الاسم: *${md.name || md.id}*\n📦 النوع: ${md.type || "image"}\n💰 التكلفة: ${md.credits || 0} MC`,
          [
            [{ text: "✏️ تعديل الإعدادات", callback_data: `emod_${md.id}` }],
            [{ text: "➕ إضافة نموذج آخر", callback_data: "add_model" }],
            [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
          ]
        );
        return new Response("OK");
      }

      // حذف نموذج مضاف (من models_added)
      if (d.startsWith("del_added_")) {
        const modelId = d.replace("del_added_", "");
        const { data: addedData } = await sb.from("memories").select("value").eq("key", "models_added").maybeSingle();
        let added: Record<string, unknown>[] = addedData?.value ? JSON.parse(addedData.value) : [];
        added = added.filter((m: any) => m.id !== modelId);
        await sb.from("memories").delete().eq("key", "models_added");
        if (added.length > 0) {
          await sb.from("memories").insert({ key: "models_added", value: JSON.stringify(added) });
        }
        await sb.from("memories").delete().eq("key", `model_config_${modelId}`);
        await send(BOT_TOKEN, chatId, msgId, `🗑 تم حذف النموذج \`${modelId}\` نهائياً.`, [
          [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
        ]);
        return new Response("OK");
      }

      // ==================== إدارة المستخدمين ====================
      if (d === "users_menu") {
        await showUsersPage(sb, BOT_TOKEN, chatId, msgId, 0);
        return new Response("OK");
      }

      if (d.startsWith("users_page_")) {
        const page = parseInt(d.replace("users_page_", "")) || 0;
        await showUsersPage(sb, BOT_TOKEN, chatId, msgId, page);
        return new Response("OK");
      }

      if (d.startsWith("uview_")) {
        const userId = d.replace("uview_", "");
        const { data: profile } = await sb.from("profiles").select("*").eq("id", userId).single();
        if (!profile) { await send(BOT_TOKEN, chatId, msgId, "❌ المستخدم غير موجود", [[{ text: "🔙 رجوع", callback_data: "users_menu" }]]); return new Response("OK"); }

        await saveSession(sb, chatId, { adminUserId: userId });
        await send(BOT_TOKEN, chatId, msgId,
          `👤 *${profile.display_name || "مستخدم"}*\n\n` +
          `🆔 \`${profile.id}\`\n` +
          `💰 الرصيد: *${Number(profile.credits).toFixed(1)} MC*\n` +
          `📋 الخطة: *${profile.plan}*\n` +
          `📅 تاريخ التسجيل: ${new Date(profile.created_at).toLocaleDateString("ar-EG")}`,
          [
            [{ text: "➕ إضافة رصيد", callback_data: `uadd_${userId}` }, { text: "➖ خصم رصيد", callback_data: `usub_${userId}` }],
            [{ text: "⭐ تغيير الخطة", callback_data: `uplan_${userId}` }],
            [{ text: "🔙 المستخدمين", callback_data: "users_menu" }],
          ]
        );
        return new Response("OK");
      }

      if (d.startsWith("uadd_")) {
        const userId = d.replace("uadd_", "");
        await send(BOT_TOKEN, chatId, msgId, "➕ *إضافة رصيد MC*\n\nاختر المبلغ:", [
          [{ text: "+5", callback_data: `mc_add_5_${userId}` }, { text: "+10", callback_data: `mc_add_10_${userId}` }, { text: "+25", callback_data: `mc_add_25_${userId}` }],
          [{ text: "+50", callback_data: `mc_add_50_${userId}` }, { text: "+100", callback_data: `mc_add_100_${userId}` }, { text: "+500", callback_data: `mc_add_500_${userId}` }],
          [{ text: "✏️ مبلغ مخصص", callback_data: `mc_custom_add_${userId}` }],
          [{ text: "🔙 رجوع", callback_data: `uview_${userId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("usub_")) {
        const userId = d.replace("usub_", "");
        await send(BOT_TOKEN, chatId, msgId, "➖ *خصم رصيد MC*\n\nاختر المبلغ:", [
          [{ text: "-5", callback_data: `mc_sub_5_${userId}` }, { text: "-10", callback_data: `mc_sub_10_${userId}` }, { text: "-25", callback_data: `mc_sub_25_${userId}` }],
          [{ text: "-50", callback_data: `mc_sub_50_${userId}` }, { text: "-100", callback_data: `mc_sub_100_${userId}` }],
          [{ text: "✏️ مبلغ مخصص", callback_data: `mc_custom_sub_${userId}` }],
          [{ text: "🔙 رجوع", callback_data: `uview_${userId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("mc_add_") || d.startsWith("mc_sub_")) {
        const isAdd = d.startsWith("mc_add_");
        const rest = d.replace(isAdd ? "mc_add_" : "mc_sub_", "");
        const idx = rest.indexOf("_");
        const amount = parseInt(rest.slice(0, idx));
        const userId = rest.slice(idx + 1);
        await applyMcChange(sb, BOT_TOKEN, chatId, msgId, userId, isAdd ? amount : -amount);
        return new Response("OK");
      }

      if (d.startsWith("mc_custom_add_") || d.startsWith("mc_custom_sub_")) {
        const isAdd = d.startsWith("mc_custom_add_");
        const userId = d.replace(isAdd ? "mc_custom_add_" : "mc_custom_sub_", "");
        await saveSession(sb, chatId, { adminAction: isAdd ? "mc_add" : "mc_sub", adminUserId: userId });
        await send(BOT_TOKEN, chatId, msgId, `✏️ أدخل المبلغ ${isAdd ? "المراد إضافته" : "المراد خصمه"}:`, [[{ text: "🔙 إلغاء", callback_data: `uview_${userId}` }]]);
        return new Response("OK");
      }

      if (d.startsWith("uplan_")) {
        const userId = d.replace("uplan_", "");
        await send(BOT_TOKEN, chatId, msgId, "⭐ *تغيير الخطة*\n\nاختر الخطة:", [
          [{ text: "🆓 Free", callback_data: `sp_free_${userId}` }, { text: "⭐ Starter", callback_data: `sp_starter_${userId}` }],
          [{ text: "💎 Pro", callback_data: `sp_pro_${userId}` }, { text: "👑 Elite", callback_data: `sp_elite_${userId}` }],
          [{ text: "🔙 رجوع", callback_data: `uview_${userId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("sp_")) {
        const rest = d.replace("sp_", "");
        const idx = rest.indexOf("_");
        const plan = rest.slice(0, idx);
        const userId = rest.slice(idx + 1);
        await sb.from("profiles").update({ plan }).eq("id", userId);
        const { data: profile } = await sb.from("profiles").select("display_name").eq("id", userId).single();
        await send(BOT_TOKEN, chatId, msgId, `✅ تم تغيير خطة *${profile?.display_name || "المستخدم"}* إلى *${plan}*`, [
          [{ text: "👤 عرض المستخدم", callback_data: `uview_${userId}` }],
          [{ text: "🔙 المستخدمين", callback_data: "users_menu" }],
        ]);
        return new Response("OK");
      }

      // ==================== OAuth Apps ====================
      if (d === "oauth_menu") {
        await clearSession(sb, chatId);
        await send(BOT_TOKEN, chatId, msgId, "🔑 *OAuth Apps*\n\nإدارة تطبيقات تسجيل الدخول:", [
          [{ text: "➕ إنشاء تطبيق جديد", callback_data: "oauth_create" }],
          [{ text: "📋 عرض التطبيقات", callback_data: "oauth_list" }],
          [{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }],
        ]);
        return new Response("OK");
      }

      if (d === "oauth_create") {
        await saveSession(sb, chatId, { oauthStep: "awaiting_name" });
        await send(BOT_TOKEN, chatId, msgId, "➕ *إنشاء تطبيق OAuth جديد*\n\nأدخل اسم التطبيق:", [
          [{ text: "🔙 إلغاء", callback_data: "oauth_menu" }],
        ]);
        return new Response("OK");
      }

      if (d === "oauth_list") {
        const { data: apps } = await sb.from("oauth_clients").select("*").order("created_at", { ascending: false });
        if (!apps || apps.length === 0) {
          await send(BOT_TOKEN, chatId, msgId, "📋 لا توجد تطبيقات OAuth حالياً.", [
            [{ text: "➕ إنشاء تطبيق", callback_data: "oauth_create" }],
            [{ text: "🔙 رجوع", callback_data: "oauth_menu" }],
          ]);
          return new Response("OK");
        }

        const rows = apps.map(app => [{
          text: `${app.name} (${app.client_id.slice(0, 8)}...)`,
          callback_data: `oapp_${app.id}`,
        }]);
        rows.push([{ text: "🔙 رجوع", callback_data: "oauth_menu" }]);
        await send(BOT_TOKEN, chatId, msgId, `📋 *تطبيقات OAuth* (${apps.length})`, rows);
        return new Response("OK");
      }

      if (d.startsWith("oapp_")) {
        const appId = d.replace("oapp_", "");
        const { data: app } = await sb.from("oauth_clients").select("*").eq("id", appId).single();
        if (!app) { await send(BOT_TOKEN, chatId, msgId, "❌ التطبيق غير موجود", [[{ text: "🔙 رجوع", callback_data: "oauth_list" }]]); return new Response("OK"); }

        const uris = (app.redirect_uris || []).join("\n") || "لم يتم تحديد";
        const logoStatus = app.logo_url ? "✅" : "❌";
        await send(BOT_TOKEN, chatId, msgId,
          `🔑 *${app.name}*\n\n` +
          `📌 Client ID:\n\`${app.client_id}\`\n\n` +
          `🔗 Redirect URIs:\n${uris}\n\n` +
          `🖼 Logo: ${logoStatus}\n` +
          `🔓 Public: ${app.is_public ? "نعم" : "لا"}\n` +
          `📅 ${new Date(app.created_at).toLocaleDateString("ar-EG")}`,
          [
            [{ text: "✏️ تعديل الاسم", callback_data: `oedit_name_${appId}` }],
            [{ text: "🖼 تعديل الصورة", callback_data: `oedit_logo_${appId}` }],
            [{ text: "🔗 تعديل Redirect URIs", callback_data: `oedit_uri_${appId}` }],
            [{ text: "🔄 إعادة توليد Secret", callback_data: `oregen_${appId}` }],
            [{ text: "🗑 حذف", callback_data: `odel_${appId}` }],
            [{ text: "🔙 رجوع", callback_data: "oauth_list" }],
          ]
        );
        return new Response("OK");
      }

      if (d.startsWith("oedit_name_")) {
        const appId = d.replace("oedit_name_", "");
        await saveSession(sb, chatId, { oauthStep: "edit_name", oauthAppId: appId });
        await send(BOT_TOKEN, chatId, msgId, "✏️ أدخل الاسم الجديد للتطبيق:", [
          [{ text: "🔙 إلغاء", callback_data: `oapp_${appId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("oedit_uri_")) {
        const appId = d.replace("oedit_uri_", "");
        await saveSession(sb, chatId, { oauthStep: "edit_uri", oauthAppId: appId });
        await send(BOT_TOKEN, chatId, msgId, "🔗 أدخل Redirect URIs الجديدة\n(كل URI في سطر منفصل):", [
          [{ text: "🔙 إلغاء", callback_data: `oapp_${appId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("oedit_logo_")) {
        const appId = d.replace("oedit_logo_", "");
        await saveSession(sb, chatId, { oauthStep: "edit_logo", oauthAppId: appId });
        await send(BOT_TOKEN, chatId, msgId, "🖼 أرسل صورة الشعار الجديدة للتطبيق:", [
          [{ text: "🗑 حذف الصورة", callback_data: `odel_logo_${appId}` }],
          [{ text: "🔙 إلغاء", callback_data: `oapp_${appId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("odel_logo_")) {
        const appId = d.replace("odel_logo_", "");
        await sb.from("oauth_clients").update({ logo_url: null }).eq("id", appId);
        await clearSession(sb, chatId);
        await send(BOT_TOKEN, chatId, msgId, "✅ تم حذف صورة التطبيق.", [
          [{ text: "🔙 رجوع للتطبيق", callback_data: `oapp_${appId}` }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("oregen_")) {
        const appId = d.replace("oregen_", "");
        const newSecret = generateId(48);
        const hashed = await hashSecret(newSecret);
        await sb.from("oauth_clients").update({ client_secret_hash: hashed }).eq("id", appId);
        await send(BOT_TOKEN, chatId, msgId,
          `🔄 *تم إعادة توليد Client Secret*\n\n⚠️ احفظه الآن — لن يظهر مرة أخرى!\n\n\`${newSecret}\``,
          [[{ text: "🔙 رجوع للتطبيق", callback_data: `oapp_${appId}` }]]
        );
        return new Response("OK");
      }

      if (d.startsWith("odel_confirm_")) {
        const appId = d.replace("odel_confirm_", "");
        await sb.from("oauth_tokens").delete().eq("client_id", appId);
        await sb.from("oauth_codes").delete().eq("client_id", appId);
        await sb.from("oauth_clients").delete().eq("id", appId);
        await send(BOT_TOKEN, chatId, msgId, "🗑 تم حذف التطبيق بنجاح.", [
          [{ text: "🔙 رجوع", callback_data: "oauth_list" }],
        ]);
        return new Response("OK");
      }

      if (d.startsWith("odel_")) {
        const appId = d.replace("odel_", "");
        await send(BOT_TOKEN, chatId, msgId, "⚠️ *هل أنت متأكد من حذف هذا التطبيق؟*\n\nسيتم حذف كل التوكنات المرتبطة.", [
          [{ text: "✅ نعم، احذف", callback_data: `odel_confirm_${appId}` }],
          [{ text: "🔙 إلغاء", callback_data: `oapp_${appId}` }],
        ]);
        return new Response("OK");
      }

      // ==================== معرض العرض (Showcase) ====================
      if (d === "showcase_menu") {
        await clearSession(sb, chatId);
        const { count } = await sb.from("showcase_items").select("*", { count: "exact", head: true });
        await send(BOT_TOKEN, chatId, msgId, `🎨 *معرض العرض (Showcase)*\n\nعناصر المعرض: *${count || 0}*\n\nإدارة المحتوى المعروض في صفحة الصور:`, [
          [{ text: "➕ إضافة عنصر جديد", callback_data: "sc_add" }],
          [{ text: "📋 عرض العناصر", callback_data: "sc_list_0" }],
          [{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }],
        ]);
        return new Response("OK");
      }

      if (d === "sc_add") {
        await saveSession(sb, chatId, { showcaseStep: "awaiting_media" });
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "🎨 *إضافة عنصر جديد للمعرض*\n\n📤 الخطوة 1/6: أرسل صورة أو فيديو:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "❌ إلغاء", callback_data: "showcase_menu" }]] }),
        });
        return new Response("OK");
      }

      // Showcase: select aspect ratio
      if (d.startsWith("sc_ar_")) {
        const ar = d.replace("sc_ar_", "");
        const session = await loadSession(sb, chatId);
        if (!session) return new Response("OK");
        session.showcaseAspect = ar;
        session.showcaseStep = "awaiting_quality";
        await saveSession(sb, chatId, session);
        await send(BOT_TOKEN, chatId, msgId, `📐 نسبة العرض: *${ar}*\n\n🎯 الخطوة 5/6: اختر الجودة:`, [
          ...SHOWCASE_QUALITIES.map(q => [{ text: q, callback_data: `sc_q_${q}` }]),
          [{ text: "❌ إلغاء", callback_data: "showcase_menu" }],
        ]);
        return new Response("OK");
      }

      // Showcase: select quality
      if (d.startsWith("sc_q_")) {
        const q = d.replace("sc_q_", "");
        const session = await loadSession(sb, chatId);
        if (!session) return new Response("OK");
        session.showcaseQuality = q;
        session.showcaseStep = "awaiting_duration";
        await saveSession(sb, chatId, session);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ الجودة: *${q}*\n\n⏱ الخطوة 6/6: أدخل المدة (مثلاً: 8 sec) أو اكتب "skip" لتخطيها:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [
            [{ text: "⏭ تخطي (بدون مدة)", callback_data: "sc_skip_duration" }],
            [{ text: "❌ إلغاء", callback_data: "showcase_menu" }],
          ]}),
        });
        return new Response("OK");
      }

      // Showcase: skip duration
      if (d === "sc_skip_duration") {
        const session = await loadSession(sb, chatId);
        if (!session) return new Response("OK");
        await saveShowcaseItem(sb, BOT_TOKEN, chatId, session, null);
        return new Response("OK");
      }

      // Showcase: select model for showcase
      if (d.startsWith("sc_model_")) {
        const modelId = d.replace("sc_model_", "");
        const session = await loadSession(sb, chatId);
        if (!session) return new Response("OK");
        session.showcaseModelId = modelId;
        session.showcaseModelName = MODEL_NAMES[modelId] || modelId;
        session.showcaseStep = "awaiting_aspect";
        await saveSession(sb, chatId, session);
        await send(BOT_TOKEN, chatId, msgId, `✅ النموذج: *${session.showcaseModelName}*\n\n📐 الخطوة 4/6: اختر نسبة العرض:`, [
          ...SHOWCASE_ASPECTS.map(ar => [{ text: ar, callback_data: `sc_ar_${ar}` }]),
          [{ text: "❌ إلغاء", callback_data: "showcase_menu" }],
        ]);
        return new Response("OK");
      }

      // Showcase: model category
      if (d.startsWith("sc_cat_")) {
        const catKey = d.replace("sc_cat_", "");
        const cat = CATEGORIES.find(c => c.key === catKey);
        if (!cat) return new Response("OK");
        const rows: { text: string; callback_data: string }[][] = [];
        for (let i = 0; i < cat.models.length; i += 2) {
          const row: { text: string; callback_data: string }[] = [];
          row.push({ text: MODEL_NAMES[cat.models[i]] || cat.models[i], callback_data: `sc_model_${cat.models[i]}` });
          if (cat.models[i + 1]) row.push({ text: MODEL_NAMES[cat.models[i + 1]] || cat.models[i + 1], callback_data: `sc_model_${cat.models[i + 1]}` });
          rows.push(row);
        }
        rows.push([{ text: "🔙 رجوع", callback_data: "sc_add" }]);
        await send(BOT_TOKEN, chatId, msgId, `🎯 اختر النموذج من *${cat.label}*:`, rows);
        return new Response("OK");
      }

      // Showcase: list items
      if (d.startsWith("sc_list_")) {
        const page = parseInt(d.replace("sc_list_", "")) || 0;
        const perPage = 5;
        const { data: items, count } = await sb.from("showcase_items")
          .select("*", { count: "exact" })
          .order("display_order", { ascending: true })
          .range(page * perPage, (page + 1) * perPage - 1);

        if (!items || items.length === 0) {
          await send(BOT_TOKEN, chatId, msgId, "📋 لا توجد عناصر في المعرض.", [
            [{ text: "➕ إضافة عنصر", callback_data: "sc_add" }],
            [{ text: "🔙 رجوع", callback_data: "showcase_menu" }],
          ]);
          return new Response("OK");
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / perPage);
        const rows = items.map((item: any) => [{
          text: `${item.media_type === "video" ? "🎬" : "🖼"} ${(item.prompt || "بدون وصف").slice(0, 25)}${item.prompt?.length > 25 ? "…" : ""}`,
          callback_data: `sc_view_${item.id}`,
        }]);

        const nav: { text: string; callback_data: string }[] = [];
        if (page > 0) nav.push({ text: "◀️", callback_data: `sc_list_${page - 1}` });
        nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
        if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `sc_list_${page + 1}` });
        rows.push(nav);
        rows.push([{ text: "🔙 رجوع", callback_data: "showcase_menu" }]);
        await send(BOT_TOKEN, chatId, msgId, `📋 *عناصر المعرض* (${total})`, rows);
        return new Response("OK");
      }

      // Showcase: view single item
      if (d.startsWith("sc_view_")) {
        const itemId = d.replace("sc_view_", "");
        const { data: item } = await sb.from("showcase_items").select("*").eq("id", itemId).single();
        if (!item) { await send(BOT_TOKEN, chatId, msgId, "❌ العنصر غير موجود", [[{ text: "🔙 رجوع", callback_data: "sc_list_0" }]]); return new Response("OK"); }

        await send(BOT_TOKEN, chatId, msgId,
          `🎨 *عنصر المعرض*\n\n` +
          `📝 البرومبت: ${(item as any).prompt || "—"}\n` +
          `🤖 النموذج: *${(item as any).model_name || "—"}*\n` +
          `📐 النسبة: ${(item as any).aspect_ratio}\n` +
          `🎯 الجودة: ${(item as any).quality}\n` +
          `⏱ المدة: ${(item as any).duration || "—"}\n` +
          `📸 النوع: ${(item as any).media_type}\n` +
          `🔢 الترتيب: ${(item as any).display_order}`,
          [
            [{ text: "🗑 حذف", callback_data: `sc_del_${itemId}` }],
            [{ text: "🔙 رجوع", callback_data: "sc_list_0" }],
          ]
        );
        return new Response("OK");
      }

      // Showcase: delete item
      if (d.startsWith("sc_del_")) {
        const itemId = d.replace("sc_del_", "");
        await sb.from("showcase_items").delete().eq("id", itemId);
        await send(BOT_TOKEN, chatId, msgId, "🗑 تم حذف العنصر من المعرض.", [
          [{ text: "📋 عرض العناصر", callback_data: "sc_list_0" }],
          [{ text: "🔙 رجوع", callback_data: "showcase_menu" }],
        ]);
        return new Response("OK");
      }

      // ==================== إعدادات الصفحات ====================
      if (d === "pagesettings_menu") {
        await clearSession(sb, chatId);
        await send(BOT_TOKEN, chatId, msgId, "⚙️ *إعدادات الصفحات*\n\nإدارة الخيارات المتاحة في صفحات التطبيق:", [
          [{ text: "🖼 إعدادات الصور", callback_data: "ps_images" }],
          [{ text: "🎬 إعدادات الفيديو", callback_data: "ps_videos" }],
          [{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }],
        ]);
        return new Response("OK");
      }

      // ---- Image page settings ----
      if (d === "ps_images") {
        const s = await getPageSettings(sb, "images") as typeof DEFAULT_PAGE_IMAGES;
        await send(BOT_TOKEN, chatId, msgId,
          `🖼 *إعدادات صفحة الصور*\n\n` +
          `🎨 الأنماط: \`${s.styles.join(", ")}\`\n` +
          `📐 النسب: \`${s.aspectRatios.join(", ")}\`\n` +
          `🔢 أقصى عدد صور: \`${s.maxImages}\`\n` +
          `✨ النمط الافتراضي: \`${s.defaultStyle}\`\n` +
          `📐 النسبة الافتراضية: \`${s.defaultAspect}\`\n` +
          `🔢 العدد الافتراضي: \`${s.defaultNumImages}\``,
          [
            [{ text: "🎨 تعديل الأنماط", callback_data: "ps_img_styles" }],
            [{ text: "📐 تعديل النسب", callback_data: "ps_img_aspects" }],
            [{ text: "🔢 أقصى عدد صور", callback_data: "ps_img_max" }],
            [{ text: "✨ النمط الافتراضي", callback_data: "ps_img_defstyle" }],
            [{ text: "📐 النسبة الافتراضية", callback_data: "ps_img_defaspect" }],
            [{ text: "🔢 العدد الافتراضي", callback_data: "ps_img_defnum" }],
            [{ text: "🗑 إعادة ضبط", callback_data: "ps_img_reset" }],
            [{ text: "🔙 رجوع", callback_data: "pagesettings_menu" }],
          ]
        );
        return new Response("OK");
      }

      if (d === "ps_img_styles") {
        await saveSession(sb, chatId, { adminAction: "ps_img_styles" });
        await send(BOT_TOKEN, chatId, msgId,
          "🎨 *تعديل الأنماط*\n\nأدخل الأنماط مفصولة بفواصل:\n\n" +
          "الأنماط المتاحة:\n`none, dynamic, cinematic, creative, fashion, portrait, stock-photo, vibrant, anime, 3d-render`",
          [[{ text: "🔙 إلغاء", callback_data: "ps_images" }]]
        );
        return new Response("OK");
      }

      if (d === "ps_img_aspects") {
        await saveSession(sb, chatId, { adminAction: "ps_img_aspects" });
        await send(BOT_TOKEN, chatId, msgId,
          "📐 *تعديل نسب العرض*\n\nأدخل النسب مفصولة بفواصل:\n\nمثال: `2:3, 1:1, 16:9, 4:3, 9:16`",
          [[{ text: "🔙 إلغاء", callback_data: "ps_images" }]]
        );
        return new Response("OK");
      }

      if (d === "ps_img_max") {
        await saveSession(sb, chatId, { adminAction: "ps_img_max" });
        await send(BOT_TOKEN, chatId, msgId, "🔢 *أقصى عدد صور*\n\nاختر العدد:", [
          [{ text: "1", callback_data: "psv_img_max_1" }, { text: "2", callback_data: "psv_img_max_2" }],
          [{ text: "4", callback_data: "psv_img_max_4" }, { text: "8", callback_data: "psv_img_max_8" }],
          [{ text: "🔙 إلغاء", callback_data: "ps_images" }],
        ]);
        return new Response("OK");
      }

      if (d === "ps_img_defstyle") {
        const s = await getPageSettings(sb, "images") as typeof DEFAULT_PAGE_IMAGES;
        const rows: { text: string; callback_data: string }[][] = [];
        for (let i = 0; i < s.styles.length; i += 3) {
          const row: { text: string; callback_data: string }[] = [];
          for (let j = i; j < Math.min(i + 3, s.styles.length); j++) {
            const st = s.styles[j];
            row.push({ text: `${st === s.defaultStyle ? "✅ " : ""}${st}`, callback_data: `psv_img_defstyle_${st}` });
          }
          rows.push(row);
        }
        rows.push([{ text: "🔙 إلغاء", callback_data: "ps_images" }]);
        await send(BOT_TOKEN, chatId, msgId, "✨ *اختر النمط الافتراضي:*", rows);
        return new Response("OK");
      }

      if (d === "ps_img_defaspect") {
        const s = await getPageSettings(sb, "images") as typeof DEFAULT_PAGE_IMAGES;
        const rows = s.aspectRatios.map(ar => [{
          text: `${ar === s.defaultAspect ? "✅ " : ""}${ar}`,
          callback_data: `psv_img_defaspect_${ar}`,
        }]);
        rows.push([{ text: "🔙 إلغاء", callback_data: "ps_images" }]);
        await send(BOT_TOKEN, chatId, msgId, "📐 *اختر النسبة الافتراضية:*", rows);
        return new Response("OK");
      }

      if (d === "ps_img_defnum") {
        await send(BOT_TOKEN, chatId, msgId, "🔢 *اختر العدد الافتراضي للصور:*", [
          [{ text: "1", callback_data: "psv_img_defnum_1" }, { text: "2", callback_data: "psv_img_defnum_2" }],
          [{ text: "3", callback_data: "psv_img_defnum_3" }, { text: "4", callback_data: "psv_img_defnum_4" }],
          [{ text: "🔙 إلغاء", callback_data: "ps_images" }],
        ]);
        return new Response("OK");
      }

      if (d === "ps_img_reset") {
        await sb.from("memories").delete().eq("key", "page_settings_images");
        await send(BOT_TOKEN, chatId, msgId, "🗑 تم إعادة ضبط إعدادات الصور.", [
          [{ text: "🔙 رجوع", callback_data: "ps_images" }],
        ]);
        return new Response("OK");
      }

      // Handle image settings quick values
      if (d.startsWith("psv_img_")) {
        const rest = d.replace("psv_img_", "");
        const idx = rest.indexOf("_");
        const field = rest.slice(0, idx);
        const value = rest.slice(idx + 1);
        const s = await getPageSettings(sb, "images") as typeof DEFAULT_PAGE_IMAGES;

        if (field === "max") (s as any).maxImages = parseInt(value);
        else if (field === "defstyle") (s as any).defaultStyle = value;
        else if (field === "defaspect") (s as any).defaultAspect = value;
        else if (field === "defnum") (s as any).defaultNumImages = parseInt(value);

        await savePageSettings(sb, "images", s);
        await send(BOT_TOKEN, chatId, msgId, `✅ تم التحديث!`, [
          [{ text: "🖼 إعدادات الصور", callback_data: "ps_images" }],
          [{ text: "🔙 القائمة", callback_data: "pagesettings_menu" }],
        ]);
        return new Response("OK");
      }

      // ---- Video page settings ----
      if (d === "ps_videos") {
        const s = await getPageSettings(sb, "videos") as typeof DEFAULT_PAGE_VIDEOS;
        await send(BOT_TOKEN, chatId, msgId,
          `🎬 *إعدادات صفحة الفيديو*\n\n` +
          `📐 النسب: \`${s.aspectRatios.join(", ")}\`\n` +
          `⏱ المدد: \`${s.durations.join(", ")}s\`\n` +
          `📺 الدقات: \`${s.resolutions.join(", ")}\`\n` +
          `📐 النسبة الافتراضية: \`${s.defaultAspect}\`\n` +
          `⏱ المدة الافتراضية: \`${s.defaultDuration}s\`\n` +
          `📺 الدقة الافتراضية: \`${s.defaultResolution}\``,
          [
            [{ text: "📐 تعديل النسب", callback_data: "ps_vid_aspects" }],
            [{ text: "⏱ تعديل المدد", callback_data: "ps_vid_durations" }],
            [{ text: "📺 تعديل الدقات", callback_data: "ps_vid_resolutions" }],
            [{ text: "📐 النسبة الافتراضية", callback_data: "ps_vid_defaspect" }],
            [{ text: "⏱ المدة الافتراضية", callback_data: "ps_vid_defdur" }],
            [{ text: "📺 الدقة الافتراضية", callback_data: "ps_vid_defres" }],
            [{ text: "🗑 إعادة ضبط", callback_data: "ps_vid_reset" }],
            [{ text: "🔙 رجوع", callback_data: "pagesettings_menu" }],
          ]
        );
        return new Response("OK");
      }

      if (d === "ps_vid_aspects") {
        await saveSession(sb, chatId, { adminAction: "ps_vid_aspects" });
        await send(BOT_TOKEN, chatId, msgId,
          "📐 *تعديل نسب العرض للفيديو*\n\nأدخل النسب مفصولة بفواصل:\n\nمثال: `9:16, 16:9, 1:1, 4:3`",
          [[{ text: "🔙 إلغاء", callback_data: "ps_videos" }]]
        );
        return new Response("OK");
      }

      if (d === "ps_vid_durations") {
        await saveSession(sb, chatId, { adminAction: "ps_vid_durations" });
        await send(BOT_TOKEN, chatId, msgId,
          "⏱ *تعديل المدد المتاحة*\n\nأدخل المدد بالثواني مفصولة بفواصل:\n\nمثال: `4, 5, 6, 8, 10`",
          [[{ text: "🔙 إلغاء", callback_data: "ps_videos" }]]
        );
        return new Response("OK");
      }

      if (d === "ps_vid_resolutions") {
        await saveSession(sb, chatId, { adminAction: "ps_vid_resolutions" });
        await send(BOT_TOKEN, chatId, msgId,
          "📺 *تعديل الدقات المتاحة*\n\nأدخل الدقات مفصولة بفواصل:\n\nمثال: `720p, 1080p, 2K, 4K`",
          [[{ text: "🔙 إلغاء", callback_data: "ps_videos" }]]
        );
        return new Response("OK");
      }

      if (d === "ps_vid_defaspect") {
        const s = await getPageSettings(sb, "videos") as typeof DEFAULT_PAGE_VIDEOS;
        const rows = s.aspectRatios.map(ar => [{
          text: `${ar === s.defaultAspect ? "✅ " : ""}${ar}`,
          callback_data: `psv_vid_defaspect_${ar}`,
        }]);
        rows.push([{ text: "🔙 إلغاء", callback_data: "ps_videos" }]);
        await send(BOT_TOKEN, chatId, msgId, "📐 *اختر النسبة الافتراضية:*", rows);
        return new Response("OK");
      }

      if (d === "ps_vid_defdur") {
        const s = await getPageSettings(sb, "videos") as typeof DEFAULT_PAGE_VIDEOS;
        const rows = [s.durations.map(dur => ({
          text: `${dur === s.defaultDuration ? "✅ " : ""}${dur}s`,
          callback_data: `psv_vid_defdur_${dur}`,
        }))];
        rows.push([{ text: "🔙 إلغاء", callback_data: "ps_videos" }]);
        await send(BOT_TOKEN, chatId, msgId, "⏱ *اختر المدة الافتراضية:*", rows);
        return new Response("OK");
      }

      if (d === "ps_vid_defres") {
        const s = await getPageSettings(sb, "videos") as typeof DEFAULT_PAGE_VIDEOS;
        const rows = [s.resolutions.map(res => ({
          text: `${res === s.defaultResolution ? "✅ " : ""}${res}`,
          callback_data: `psv_vid_defres_${res}`,
        }))];
        rows.push([{ text: "🔙 إلغاء", callback_data: "ps_videos" }]);
        await send(BOT_TOKEN, chatId, msgId, "📺 *اختر الدقة الافتراضية:*", rows);
        return new Response("OK");
      }

      if (d === "ps_vid_reset") {
        await sb.from("memories").delete().eq("key", "page_settings_videos");
        await send(BOT_TOKEN, chatId, msgId, "🗑 تم إعادة ضبط إعدادات الفيديو.", [
          [{ text: "🔙 رجوع", callback_data: "ps_videos" }],
        ]);
        return new Response("OK");
      }

      // Handle video settings quick values
      if (d.startsWith("psv_vid_")) {
        const rest = d.replace("psv_vid_", "");
        const idx = rest.indexOf("_");
        const field = rest.slice(0, idx);
        const value = rest.slice(idx + 1);
        const s = await getPageSettings(sb, "videos") as typeof DEFAULT_PAGE_VIDEOS;

        if (field === "defaspect") (s as any).defaultAspect = value;
        else if (field === "defdur") (s as any).defaultDuration = parseInt(value);
        else if (field === "defres") (s as any).defaultResolution = value;

        await savePageSettings(sb, "videos", s);
        await send(BOT_TOKEN, chatId, msgId, `✅ تم التحديث!`, [
          [{ text: "🎬 إعدادات الفيديو", callback_data: "ps_videos" }],
          [{ text: "🔙 القائمة", callback_data: "pagesettings_menu" }],
        ]);
        return new Response("OK");
      }

      // ==================== الإحصائيات ====================
      if (d === "stats") {
        const { count: userCount } = await sb.from("profiles").select("*", { count: "exact", head: true });
        const { count: convCount } = await sb.from("conversations").select("*", { count: "exact", head: true });
        const { count: msgCount } = await sb.from("messages").select("*", { count: "exact", head: true });
        const { count: projectCount } = await sb.from("projects").select("*", { count: "exact", head: true });
        const { count: oauthCount } = await sb.from("oauth_clients").select("*", { count: "exact", head: true });
        const { count: showcaseCount } = await sb.from("showcase_items").select("*", { count: "exact", head: true });
        const imgMedia = await getExistingMedia(sb, IMAGE_MODELS);
        const vidMedia = await getExistingMedia(sb, VIDEO_MODELS);

        await send(BOT_TOKEN, chatId, msgId,
          `📊 *إحصائيات النظام*\n\n` +
          `👥 المستخدمين: *${userCount || 0}*\n` +
          `💬 المحادثات: *${convCount || 0}*\n` +
          `📝 الرسائل: *${msgCount || 0}*\n` +
          `💻 المشاريع: *${projectCount || 0}*\n` +
          `🔑 OAuth Apps: *${oauthCount || 0}*\n` +
          `🎨 Showcase: *${showcaseCount || 0}*\n` +
          `🖼 وسائط الصور: *${imgMedia.size}/${IMAGE_MODELS.length}*\n` +
          `🎬 وسائط الفيديو: *${vidMedia.size}/${VIDEO_MODELS.length}*`,
          [[{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }]]
        );
        return new Response("OK");
      }

      return new Response("OK");
    }

    // ==================== رسائل نصية / وسائط ====================
    if (message) {
      const chatId = message.chat.id;
      const text = message.text;

      if (text === "/start") {
        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "🤖 *لوحة تحكم Megsy*\n\nمرحباً! اختر عملية:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: mainMenuKB() }),
        });
        return new Response("OK");
      }

      const session = await loadSession(sb, chatId);

      // ---- Page settings text inputs ----
      if (session?.adminAction?.startsWith("ps_") && text) {
        const action = session.adminAction;
        const input = text.trim();

        if (action === "ps_img_styles") {
          const styles = input.split(",").map(s => s.trim()).filter(Boolean);
          const s = await getPageSettings(sb, "images");
          (s as any).styles = styles;
          await savePageSettings(sb, "images", s);
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ تم تحديث الأنماط: \`${styles.join(", ")}\``, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🖼 إعدادات الصور", callback_data: "ps_images" }]] }),
          });
          return new Response("OK");
        }

        if (action === "ps_img_aspects") {
          const aspects = input.split(",").map(s => s.trim()).filter(Boolean);
          const s = await getPageSettings(sb, "images");
          (s as any).aspectRatios = aspects;
          await savePageSettings(sb, "images", s);
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ تم تحديث النسب: \`${aspects.join(", ")}\``, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🖼 إعدادات الصور", callback_data: "ps_images" }]] }),
          });
          return new Response("OK");
        }

        if (action === "ps_vid_aspects") {
          const aspects = input.split(",").map(s => s.trim()).filter(Boolean);
          const s = await getPageSettings(sb, "videos");
          (s as any).aspectRatios = aspects;
          await savePageSettings(sb, "videos", s);
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ تم تحديث النسب: \`${aspects.join(", ")}\``, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🎬 إعدادات الفيديو", callback_data: "ps_videos" }]] }),
          });
          return new Response("OK");
        }

        if (action === "ps_vid_durations") {
          const durations = input.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
          const s = await getPageSettings(sb, "videos");
          (s as any).durations = durations;
          await savePageSettings(sb, "videos", s);
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ تم تحديث المدد: \`${durations.join(", ")}s\``, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🎬 إعدادات الفيديو", callback_data: "ps_videos" }]] }),
          });
          return new Response("OK");
        }

        if (action === "ps_vid_resolutions") {
          const resolutions = input.split(",").map(s => s.trim()).filter(Boolean);
          const s = await getPageSettings(sb, "videos");
          (s as any).resolutions = resolutions;
          await savePageSettings(sb, "videos", s);
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ تم تحديث الدقات: \`${resolutions.join(", ")}\``, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🎬 إعدادات الفيديو", callback_data: "ps_videos" }]] }),
          });
          return new Response("OK");
        }
      }

      // ---- Add model text inputs ----
      if (session?.addModelStep === "awaiting_id" && text) {
        const id = text.trim().replace(/\s+/g, "-").toLowerCase();
        session.addModelData = { ...(session.addModelData || {}), id };
        session.addModelStep = "awaiting_name";
        await saveSession(sb, chatId, session);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId, text: `✅ ID: \`${id}\`\n\n📛 الخطوة 2/5: أدخل اسم النموذج:`, parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 إلغاء", callback_data: "edit_menu" }]] }),
        });
        return new Response("OK");
      }

      if (session?.addModelStep === "awaiting_name" && text) {
        session.addModelData = { ...(session.addModelData || {}), name: text.trim() };
        session.addModelStep = "awaiting_type";
        await saveSession(sb, chatId, session);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId, text: `✅ الاسم: *${text.trim()}*\n\n📦 الخطوة 3/5: اختر النوع:`, parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [
            [{ text: "🖼 image", callback_data: "am_type_image" }, { text: "🔧 image-tool", callback_data: "am_type_image-tool" }],
            [{ text: "🎬 video", callback_data: "am_type_video" }, { text: "🎬 video-i2v", callback_data: "am_type_video-i2v" }],
            [{ text: "💬 chat", callback_data: "am_type_chat" }, { text: "👤 video-avatar", callback_data: "am_type_video-avatar" }],
            [{ text: "🔙 إلغاء", callback_data: "edit_menu" }],
          ]}),
        });
        return new Response("OK");
      }

      if (session?.addModelStep === "awaiting_credits_text" && text) {
        const credits = parseInt(text.trim());
        if (isNaN(credits) || credits < 0) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "❌ أدخل رقم صحيح:" });
          return new Response("OK");
        }
        session.addModelData = { ...(session.addModelData || {}), credits: String(credits) };
        session.addModelStep = "awaiting_description";
        await saveSession(sb, chatId, session);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId, text: `✅ التكلفة: *${credits} MC*\n\n📝 الخطوة 5/5: أدخل وصف النموذج:`, parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "am_save" }], [{ text: "🔙 إلغاء", callback_data: "edit_menu" }]] }),
        });
        return new Response("OK");
      }

      if (session?.addModelStep === "awaiting_description" && text) {
        session.addModelData = { ...(session.addModelData || {}), description: text.trim() };
        await saveSession(sb, chatId, session);
        // Auto-save
        const md = session.addModelData;
        const { data: addedData } = await sb.from("memories").select("value").eq("key", "models_added").maybeSingle();
        const added: Record<string, unknown>[] = addedData?.value ? JSON.parse(addedData.value) : [];
        added.push({
          id: md.id, name: md.name || md.id, type: md.type || "image",
          credits: Number(md.credits) || 0, description: md.description || "",
          longDescription: md.description || "", icon: "Image",
          modes: ["text-to-image"], acceptsImages: false, requiresImage: false,
          maxImages: 0, acceptedMimeTypes: [], provider: "Megsy", speed: "standard", quality: "high",
        });
        await sb.from("memories").delete().eq("key", "models_added");
        await sb.from("memories").insert({ key: "models_added", value: JSON.stringify(added) });
        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ *تم إضافة النموذج بنجاح!*\n\n📌 ID: \`${md.id}\`\n📛 الاسم: *${md.name || md.id}*\n📦 النوع: ${md.type || "image"}\n💰 التكلفة: ${md.credits || 0} MC\n📝 الوصف: ${(md.description || "").slice(0, 50)}`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [
            [{ text: "✏️ تعديل الإعدادات", callback_data: `emod_${md.id}` }],
            [{ text: "➕ إضافة نموذج آخر", callback_data: "add_model" }],
            [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
          ]}),
        });
        return new Response("OK");
      }

      // ---- Showcase text inputs ----
      // Step 2: receive prompt
      if (session?.showcaseStep === "awaiting_prompt" && text) {
        session.showcasePrompt = text.trim();
        session.showcaseStep = "awaiting_model";
        await saveSession(sb, chatId, session);
        // Show model categories
        const rows = CATEGORIES.map(c => [{
          text: `${c.emoji} ${c.label}`,
          callback_data: `sc_cat_${c.key}`,
        }]);
        rows.push([{ text: "❌ إلغاء", callback_data: "showcase_menu" }]);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ البرومبت: *${text.trim().slice(0, 50)}${text.trim().length > 50 ? "…" : ""}*\n\n🤖 الخطوة 3/6: اختر قسم النموذج:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: rows }),
        });
        return new Response("OK");
      }

      // Step 6: receive duration text
      if (session?.showcaseStep === "awaiting_duration" && text) {
        const duration = text.trim().toLowerCase() === "skip" ? null : text.trim();
        await saveShowcaseItem(sb, BOT_TOKEN, chatId, session, duration);
        return new Response("OK");
      }

      // Step 1: receive media for showcase
      if (session?.showcaseStep === "awaiting_media") {
        let fileId: string | null = null;
        let mediaType: "image" | "video" = "image";

        if (message.photo?.length > 0) { fileId = message.photo[message.photo.length - 1].file_id; mediaType = "image"; }
        else if (message.video) { fileId = message.video.file_id; mediaType = "video"; }
        else if (message.animation) { fileId = message.animation.file_id; mediaType = "video"; }
        else if (message.document) {
          const mime = message.document.mime_type || "";
          if (mime.startsWith("image/")) { fileId = message.document.file_id; mediaType = "image"; }
          else if (mime.startsWith("video/")) { fileId = message.document.file_id; mediaType = "video"; }
        }

        if (!fileId) {
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: "أرسل صورة أو فيديو فقط.",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "❌ إلغاء", callback_data: "showcase_menu" }]] }),
          });
          return new Response("OK");
        }

        const fileInfo = await tg(BOT_TOKEN, "getFile", { file_id: fileId });
        const filePath = fileInfo.result?.file_path;
        if (!filePath) { await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "فشل تحميل الملف." }); return new Response("OK"); }

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        const fileResp = await fetch(fileUrl);
        const fileBuffer = await fileResp.arrayBuffer();
        const ext = filePath.split(".").pop() || (mediaType === "image" ? "jpg" : "mp4");
        const storagePath = `showcase/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await sb.storage.from("model-media").upload(storagePath, fileBuffer, {
          contentType: mediaType === "image" ? `image/${ext}` : `video/${ext}`,
          upsert: true,
        });

        if (uploadError) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `خطأ في الرفع: ${uploadError.message}` });
          return new Response("OK");
        }

        const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
        session.showcaseMediaUrl = urlData.publicUrl;
        session.showcaseMediaType = mediaType;
        session.showcaseStep = "awaiting_prompt";
        await saveSession(sb, chatId, session);

        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم رفع ${mediaType === "image" ? "الصورة" : "الفيديو"} بنجاح!\n\n📝 الخطوة 2/6: أدخل البرومبت (الوصف):`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "❌ إلغاء", callback_data: "showcase_menu" }]] }),
        });
        return new Response("OK");
      }

      // ---- OAuth text inputs ----
      if (session?.oauthStep === "awaiting_name" && text) {
        const appName = text.trim();
        await saveSession(sb, chatId, { oauthStep: "awaiting_uri", oauthAppName: appName });
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ اسم التطبيق: *${appName}*\n\nالآن أدخل Redirect URI:\n(مثال: \`https://myapp.com/callback\`)`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 إلغاء", callback_data: "oauth_menu" }]] }),
        });
        return new Response("OK");
      }

      if (session?.oauthStep === "awaiting_uri" && text && session.oauthAppName) {
        const uris = text.trim().split("\n").map(u => u.trim()).filter(u => u.length > 0);
        const clientId = `megsy_${generateId(24)}`;
        const clientSecret = generateId(48);
        const secretHash = await hashSecret(clientSecret);

        const { data: app, error } = await sb.from("oauth_clients").insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          client_id: clientId,
          client_secret_hash: secretHash,
          name: session.oauthAppName,
          redirect_uris: uris,
        }).select().single();

        if (error) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `❌ خطأ: ${error.message}` });
          return new Response("OK");
        }

        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ *تم إنشاء التطبيق بنجاح!*\n\n` +
            `📛 الاسم: *${session.oauthAppName}*\n\n` +
            `📌 Client ID:\n\`${clientId}\`\n\n` +
            `🔐 Client Secret:\n\`${clientSecret}\`\n\n` +
            `⚠️ *احفظ الـ Secret الآن — لن يظهر مرة أخرى!*\n\n` +
            `🔗 Redirect URIs:\n${uris.join("\n")}`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [
            [{ text: "🔑 عرض التطبيقات", callback_data: "oauth_list" }],
            [{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }],
          ]}),
        });
        return new Response("OK");
      }

      if (session?.oauthStep === "edit_name" && text && session.oauthAppId) {
        await sb.from("oauth_clients").update({ name: text.trim() }).eq("id", session.oauthAppId);
        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم تحديث الاسم إلى: *${text.trim()}*`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 رجوع للتطبيق", callback_data: `oapp_${session.oauthAppId}` }]] }),
        });
        return new Response("OK");
      }

      if (session?.oauthStep === "edit_uri" && text && session.oauthAppId) {
        const uris = text.trim().split("\n").map(u => u.trim()).filter(u => u.length > 0);
        await sb.from("oauth_clients").update({ redirect_uris: uris }).eq("id", session.oauthAppId);
        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم تحديث Redirect URIs:\n${uris.join("\n")}`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 رجوع للتطبيق", callback_data: `oapp_${session.oauthAppId}` }]] }),
        });
        return new Response("OK");
      }

      // Upload OAuth app logo
      if (session?.oauthStep === "edit_logo" && session.oauthAppId) {
        let fileId: string | null = null;
        if (message.photo?.length > 0) fileId = message.photo[message.photo.length - 1].file_id;
        else if (message.document?.mime_type?.startsWith("image/")) fileId = message.document.file_id;

        if (!fileId) {
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: "أرسل صورة فقط.",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 إلغاء", callback_data: `oapp_${session.oauthAppId}` }]] }),
          });
          return new Response("OK");
        }

        const fileInfo = await tg(BOT_TOKEN, "getFile", { file_id: fileId });
        const filePath = fileInfo.result?.file_path;
        if (!filePath) { await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "فشل تحميل الملف." }); return new Response("OK"); }

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        const fileResp = await fetch(fileUrl);
        const fileBuffer = await fileResp.arrayBuffer();
        const ext = filePath.split(".").pop() || "jpg";
        const storagePath = `oauth-logos/${session.oauthAppId}.${ext}`;

        const { error: uploadError } = await sb.storage.from("model-media").upload(storagePath, fileBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

        if (uploadError) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `خطأ في الرفع: ${uploadError.message}` });
          return new Response("OK");
        }

        const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
        await sb.from("oauth_clients").update({ logo_url: urlData.publicUrl }).eq("id", session.oauthAppId);
        await clearSession(sb, chatId);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم تحديث صورة التطبيق بنجاح!`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 رجوع للتطبيق", callback_data: `oapp_${session.oauthAppId}` }]] }),
        });
        return new Response("OK");
      }

      // إدخال قيمة حقل
      if (session?.adminAction === "awaiting_value" && text && session.adminModelId && session.adminField) {
        const config = await getModelConfig(sb, session.adminModelId);
        config[session.adminField] = text.trim();
        await setModelConfig(sb, session.adminModelId, config);
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم تحديث *${session.adminField}* → \`${text.trim()}\``,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [
            [{ text: "✏️ تعديل المزيد", callback_data: `emod_${session.adminModelId}` }],
            [{ text: "🔙 القائمة", callback_data: "edit_menu" }],
          ]}),
        });
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // إدخال MC مخصص
      if ((session?.adminAction === "mc_add" || session?.adminAction === "mc_sub") && text && session.adminUserId) {
        const amount = parseFloat(text.trim());
        if (isNaN(amount) || amount <= 0) {
          await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "❌ أدخل رقم صحيح موجب:" });
          return new Response("OK");
        }
        const change = session.adminAction === "mc_add" ? amount : -amount;
        await applyMcChange(sb, BOT_TOKEN, chatId, undefined, session.adminUserId, change);
        await saveSession(sb, chatId, { adminAction: "idle" });
        return new Response("OK");
      }

      // رفع صورة / فيديو (model media upload)
      if (session?.page && session.models) {
        const currentModelId = session.models[session.modelIndex || 0];
        const currentModelName = MODEL_NAMES[currentModelId] || currentModelId;
        let fileId: string | null = null;
        let mediaType: "image" | "video" = "image";

        if (message.photo?.length > 0) { fileId = message.photo[message.photo.length - 1].file_id; mediaType = "image"; }
        else if (message.video) { fileId = message.video.file_id; mediaType = "video"; }
        else if (message.animation) { fileId = message.animation.file_id; mediaType = "video"; }
        else if (message.document) {
          const mime = message.document.mime_type || "";
          if (mime.startsWith("image/")) { fileId = message.document.file_id; mediaType = "image"; }
          else if (mime.startsWith("video/")) { fileId = message.document.file_id; mediaType = "video"; }
        }

        if (!fileId) {
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: "أرسل صورة أو فيديو فقط.",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "skip_model" }, { text: "❌ إلغاء", callback_data: "upload_menu" }]] }),
          });
          return new Response("OK");
        }

        const fileInfo = await tg(BOT_TOKEN, "getFile", { file_id: fileId });
        const filePath = fileInfo.result?.file_path;
        if (!filePath) { await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "فشل تحميل الملف." }); return new Response("OK"); }

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        const fileResp = await fetch(fileUrl);
        const fileBuffer = await fileResp.arrayBuffer();
        const ext = filePath.split(".").pop() || (mediaType === "image" ? "jpg" : "mp4");
        const storagePath = `${currentModelId}.${ext}`;

        const { error: uploadError } = await sb.storage.from("model-media").upload(storagePath, fileBuffer, {
          contentType: mediaType === "image" ? `image/${ext}` : `video/${ext}`,
          upsert: true,
        });

        if (uploadError) { await tg(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `خطأ في الرفع: ${uploadError.message}` }); return new Response("OK"); }

        const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
        await sb.from("model_media").upsert({
          model_id: currentModelId, media_url: urlData.publicUrl, media_type: mediaType, updated_at: new Date().toISOString(),
        }, { onConflict: "model_id" });

        session.modelIndex = (session.modelIndex || 0) + 1;
        const remaining = session.models.length - session.modelIndex;

        if (remaining === 0) {
          await clearSession(sb, chatId);
          await tg(BOT_TOKEN, "sendMessage", {
            chat_id: chatId, text: `✅ تم رفع *${currentModelName}*\n\nانتهت كل النماذج!`, parse_mode: "Markdown",
            reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔙 رجوع", callback_data: "upload_menu" }]] }),
          });
          return new Response("OK");
        }

        await saveSession(sb, chatId, session);
        const nextId = session.models[session.modelIndex];
        await tg(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم رفع *${currentModelName}*!\n\nالمتبقي: *${remaining}*\n\n🎯 التالي: *${MODEL_NAMES[nextId] || nextId}*\n\`${nextId}\`\n\nأرسل ${session.page === "images" ? "صورة" : "فيديو"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "skip_model" }, { text: "❌ إلغاء", callback_data: "upload_menu" }]] }),
        });
        return new Response("OK");
      }

      // رسالة افتراضية
      await tg(BOT_TOKEN, "sendMessage", {
        chat_id: chatId, text: "اضغط /start للبدء.",
        reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🚀 ابدأ", callback_data: "main_menu" }]] }),
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

// ---- دوال مساعدة ----
async function showUsersPage(sb: ReturnType<typeof createClient>, token: string, chatId: number, msgId: number | undefined, page: number) {
  const from = page * USERS_PER_PAGE;
  const { data: users, count } = await sb.from("profiles")
    .select("id, display_name, credits, plan, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + USERS_PER_PAGE - 1);

  const total = count || 0;
  const totalPages = Math.ceil(total / USERS_PER_PAGE) || 1;

  if (!users || users.length === 0) {
    await send(token, chatId, msgId, "لا يوجد مستخدمين.", [[{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }]]);
    return;
  }

  const rows: { text: string; callback_data: string }[][] = users.map(u => [{
    text: `${u.display_name || "مستخدم"} — ${Number(u.credits).toFixed(0)} MC (${u.plan})`,
    callback_data: `uview_${u.id}`,
  }]);

  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) navRow.push({ text: "◀️ السابق", callback_data: `users_page_${page - 1}` });
  navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) navRow.push({ text: "التالي ▶️", callback_data: `users_page_${page + 1}` });
  rows.push(navRow);
  rows.push([{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }]);

  await send(token, chatId, msgId, `👥 *المستخدمين* (${total} إجمالي)\n\nاختر مستخدم:`, rows);
}

async function applyMcChange(sb: ReturnType<typeof createClient>, token: string, chatId: number, msgId: number | undefined, userId: string, change: number) {
  const { data: profile } = await sb.from("profiles").select("credits, display_name").eq("id", userId).single();
  if (!profile) { await send(token, chatId, msgId, "❌ المستخدم غير موجود", [[{ text: "🔙 رجوع", callback_data: "users_menu" }]]); return; }

  const newCredits = Math.max(0, Number(profile.credits) + change);
  await sb.from("profiles").update({ credits: newCredits }).eq("id", userId);
  await sb.from("credit_transactions").insert({
    user_id: userId, amount: Math.abs(change),
    action_type: change >= 0 ? "admin_add" : "admin_deduct",
    description: `أدمن: ${change >= 0 ? "+" : ""}${change} MC`,
  });

  await send(token, chatId, msgId,
    `✅ *${profile.display_name || "مستخدم"}*\n\n` +
    `الرصيد السابق: ${Number(profile.credits).toFixed(1)} MC\n` +
    `التغيير: ${change >= 0 ? "+" : ""}${change}\n` +
    `الرصيد الجديد: ${newCredits.toFixed(1)} MC`,
    [
      [{ text: "👤 عرض المستخدم", callback_data: `uview_${userId}` }],
      [{ text: "🔙 المستخدمين", callback_data: "users_menu" }],
    ]
  );
}

// ---- Showcase save helper ----
async function saveShowcaseItem(sb: ReturnType<typeof createClient>, token: string, chatId: number, session: BotSession, duration: string | null) {
  // Get max display_order
  const { data: maxOrder } = await sb.from("showcase_items")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (maxOrder && maxOrder.length > 0 ? (maxOrder[0] as any).display_order : 0) + 1;

  const { error } = await sb.from("showcase_items").insert({
    media_url: session.showcaseMediaUrl,
    media_type: session.showcaseMediaType || "image",
    prompt: session.showcasePrompt || "",
    model_id: session.showcaseModelId || "",
    model_name: session.showcaseModelName || "",
    aspect_ratio: session.showcaseAspect || "1:1",
    quality: session.showcaseQuality || "2K",
    duration: duration,
    display_order: nextOrder,
  });

  await clearSession(sb, chatId);

  if (error) {
    await tg(token, "sendMessage", { chat_id: chatId, text: `❌ خطأ في الحفظ: ${error.message}` });
    return;
  }

  await tg(token, "sendMessage", {
    chat_id: chatId,
    text: `✅ *تم إضافة العنصر للمعرض بنجاح!*\n\n` +
      `📝 البرومبت: ${(session.showcasePrompt || "").slice(0, 50)}\n` +
      `🤖 النموذج: ${session.showcaseModelName}\n` +
      `📐 النسبة: ${session.showcaseAspect}\n` +
      `🎯 الجودة: ${session.showcaseQuality}\n` +
      (duration ? `⏱ المدة: ${duration}\n` : "") +
      `🔢 الترتيب: ${nextOrder}`,
    parse_mode: "Markdown",
    reply_markup: JSON.stringify({ inline_keyboard: [
      [{ text: "➕ إضافة عنصر آخر", callback_data: "sc_add" }],
      [{ text: "📋 عرض المعرض", callback_data: "sc_list_0" }],
      [{ text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }],
    ]}),
  });
}
