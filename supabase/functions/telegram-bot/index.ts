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
};

// ---- Persistent session helpers (using memories table) ----
interface BotSession {
  page: "images" | "videos";
  modelIndex: number;
  models: string[];
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

      if (data === "page_images" || data === "page_videos") {
        const page = data === "page_images" ? "images" : "videos";
        const allModels = page === "images" ? IMAGE_MODELS : VIDEO_MODELS;

        const existing = await getExistingMedia(sb, allModels);
        const remaining = allModels.filter(m => !existing.has(m));

        if (remaining.length === 0) {
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId,
            text: `All ${page} models already have media! Nothing to upload.`,
          });
          return new Response("OK");
        }

        const session: BotSession = { page, modelIndex: 0, models: remaining };
        await saveSession(sb, chatId, session);

        const modelId = remaining[0];
        const modelName = MODEL_NAMES[modelId] || modelId;

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `*${page === "images" ? "Image" : "Video"} Models*\n\n` +
            `Remaining: *${remaining.length}* models\n\n` +
            `Model: *${modelName}*\n` +
            `ID: \`${modelId}\`\n\n` +
            `Send ${page === "images" ? "an image" : "a video"} for this model:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]],
          }),
        });

        return new Response("OK");
      }

      if (data === "skip_model") {
        const session = await loadSession(sb, chatId);
        if (!session) {
          await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "No active session. Press /start" });
          return new Response("OK");
        }

        session.modelIndex++;
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
          text: `Skipped.\n\nRemaining: *${remaining}* models\n\nModel: *${modelName}*\nID: \`${modelId}\`\n\nSend ${session.page === "images" ? "an image" : "a video"}:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]],
          }),
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

      return new Response("OK");
    }

    if (message) {
      const chatId = message.chat.id;
      const text = message.text;

      if (text === "/start") {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "*Megsy Model Media Bot*\n\nChoose a page to upload media:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Image Models", callback_data: "page_images" },
                { text: "Video Models", callback_data: "page_videos" },
              ],
              [
                { text: "Status", callback_data: "status" },
              ],
            ],
          }),
        });
        return new Response("OK");
      }

      // Handle photo/video upload
      const session = await loadSession(sb, chatId);
      if (!session) {
        await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "Press /start to begin." });
        return new Response("OK");
      }

      const currentModelId = session.models[session.modelIndex];
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
          chat_id: chatId,
          text: "Send an image or video only.",
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

      const { error: uploadError } = await sb.storage
        .from("model-media")
        .upload(storagePath, fileBuffer, {
          contentType: mediaType === "image" ? `image/${ext}` : `video/${ext}`,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `Upload error: ${uploadError.message}` });
        return new Response("OK");
      }

      const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      await sb.from("model_media").upsert({
        model_id: currentModelId,
        media_url: publicUrl,
        media_type: mediaType,
        updated_at: new Date().toISOString(),
      }, { onConflict: "model_id" });

      // Move to next
      session.modelIndex++;
      const remaining = session.models.length - session.modelIndex;

      if (remaining === 0) {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `Uploaded for *${currentModelName}*\n\nAll models done!`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Image Models", callback_data: "page_images" },
                { text: "Video Models", callback_data: "page_videos" },
              ],
            ],
          }),
        });
        await clearSession(sb, chatId);
        return new Response("OK");
      }

      await saveSession(sb, chatId, session);
      const nextModelId = session.models[session.modelIndex];
      const nextModelName = MODEL_NAMES[nextModelId] || nextModelId;

      await callTelegram(BOT_TOKEN, "sendMessage", {
        chat_id: chatId,
        text: `Uploaded for *${currentModelName}*\n\nRemaining: *${remaining}* models\n\nNext: *${nextModelName}*\nID: \`${nextModelId}\`\n\nSend ${session.page === "images" ? "an image" : "a video"}:`,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
          inline_keyboard: [[{ text: "Skip", callback_data: "skip_model" }]],
        }),
      });

      return new Response("OK");
    }

    return new Response("OK");
  } catch (e) {
    console.error("Telegram bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
