import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All models grouped by page
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

// In-memory session state per chat (simple, resets on redeploy)
const sessions: Record<number, { page: "images" | "videos"; modelIndex: number; models: string[] }> = {};

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

      // Answer callback to remove loading
      await callTelegram(BOT_TOKEN, "answerCallbackQuery", { callback_query_id: callback.id });

      if (data === "page_images" || data === "page_videos") {
        const page = data === "page_images" ? "images" : "videos";
        const allModels = page === "images" ? IMAGE_MODELS : VIDEO_MODELS;

        // Find models without media
        const existing = await getExistingMedia(sb, allModels);
        const remaining = allModels.filter(m => !existing.has(m));

        if (remaining.length === 0) {
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId,
            text: `✅ All ${page} models already have media! Nothing to upload.`,
          });
          return new Response("OK");
        }

        sessions[chatId] = { page, modelIndex: 0, models: remaining };
        const modelId = remaining[0];
        const modelName = MODEL_NAMES[modelId] || modelId;
        const mediaType = page === "images" ? "📷 صورة" : "🎬 فيديو";

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `📦 *${page === "images" ? "Image" : "Video"} Models*\n\n` +
            `متبقي: *${remaining.length}* نموذج\n\n` +
            `▶️ النموذج: *${modelName}*\n` +
            `🆔 \`${modelId}\`\n\n` +
            `أرسل ${mediaType} لهذا النموذج:`,
          parse_mode: "Markdown",
        });

        return new Response("OK");
      }

      if (data === "skip_model") {
        const session = sessions[chatId];
        if (!session) return new Response("OK");

        session.modelIndex++;
        if (session.modelIndex >= session.models.length) {
          await callTelegram(BOT_TOKEN, "sendMessage", {
            chat_id: chatId,
            text: "✅ تم الانتهاء من جميع النماذج!",
          });
          delete sessions[chatId];
          return new Response("OK");
        }

        const modelId = session.models[session.modelIndex];
        const modelName = MODEL_NAMES[modelId] || modelId;
        const remaining = session.models.length - session.modelIndex;
        const mediaType = session.page === "images" ? "📷 صورة" : "🎬 فيديو";

        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `⏭ تم تخطي النموذج السابق\n\n` +
            `متبقي: *${remaining}* نموذج\n\n` +
            `▶️ النموذج: *${modelName}*\n` +
            `🆔 \`${modelId}\`\n\n` +
            `أرسل ${mediaType} لهذا النموذج:`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "skip_model" }]],
          }),
        });

        return new Response("OK");
      }

      return new Response("OK");
    }

    if (message) {
      const chatId = message.chat.id;
      const text = message.text;

      // /start command
      if (text === "/start") {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "🤖 *Megsy Model Media Bot*\n\nاختر الصفحة لرفع الصور/الفيديوهات:",
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "📷 Image Models", callback_data: "page_images" },
                { text: "🎬 Video Models", callback_data: "page_videos" },
              ],
              [
                { text: "📊 الحالة", callback_data: "status" },
              ],
            ],
          }),
        });
        return new Response("OK");
      }

      // Handle photo/video upload
      const session = sessions[chatId];
      if (!session) {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "اضغط /start للبدء",
        });
        return new Response("OK");
      }

      const currentModelId = session.models[session.modelIndex];
      const currentModelName = MODEL_NAMES[currentModelId] || currentModelId;
      let fileId: string | null = null;
      let mediaType: "image" | "video" = "image";

      // Check for photo
      if (message.photo && message.photo.length > 0) {
        // Get largest photo
        fileId = message.photo[message.photo.length - 1].file_id;
        mediaType = "image";
      }
      // Check for video
      else if (message.video) {
        fileId = message.video.file_id;
        mediaType = "video";
      }
      // Check for animation (GIF)
      else if (message.animation) {
        fileId = message.animation.file_id;
        mediaType = "video";
      }
      // Check for document (could be image/video)
      else if (message.document) {
        const mime = message.document.mime_type || "";
        if (mime.startsWith("image/")) {
          fileId = message.document.file_id;
          mediaType = "image";
        } else if (mime.startsWith("video/")) {
          fileId = message.document.file_id;
          mediaType = "video";
        }
      }

      if (!fileId) {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: "❌ أرسل صورة أو فيديو فقط.",
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "skip_model" }]],
          }),
        });
        return new Response("OK");
      }

      // Download file from Telegram
      const fileInfo = await callTelegram(BOT_TOKEN, "getFile", { file_id: fileId });
      const filePath = fileInfo.result?.file_path;
      if (!filePath) {
        await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: "❌ فشل في تحميل الملف." });
        return new Response("OK");
      }

      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
      const fileResp = await fetch(fileUrl);
      const fileBuffer = await fileResp.arrayBuffer();
      const ext = filePath.split(".").pop() || (mediaType === "image" ? "jpg" : "mp4");
      const storagePath = `${currentModelId}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await sb.storage
        .from("model-media")
        .upload(storagePath, fileBuffer, {
          contentType: mediaType === "image" ? `image/${ext}` : `video/${ext}`,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        await callTelegram(BOT_TOKEN, "sendMessage", { chat_id: chatId, text: `❌ خطأ في الرفع: ${uploadError.message}` });
        return new Response("OK");
      }

      // Get public URL
      const { data: urlData } = sb.storage.from("model-media").getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Upsert into model_media table
      await sb.from("model_media").upsert({
        model_id: currentModelId,
        media_url: publicUrl,
        media_type: mediaType,
        updated_at: new Date().toISOString(),
      }, { onConflict: "model_id" });

      // Move to next model
      session.modelIndex++;
      const remaining = session.models.length - session.modelIndex;

      if (remaining === 0) {
        await callTelegram(BOT_TOKEN, "sendMessage", {
          chat_id: chatId,
          text: `✅ تم رفع ${mediaType === "image" ? "صورة" : "فيديو"} لـ *${currentModelName}*\n\n🎉 انتهت جميع النماذج!`,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "📷 Image Models", callback_data: "page_images" },
                { text: "🎬 Video Models", callback_data: "page_videos" },
              ],
            ],
          }),
        });
        delete sessions[chatId];
        return new Response("OK");
      }

      const nextModelId = session.models[session.modelIndex];
      const nextModelName = MODEL_NAMES[nextModelId] || nextModelId;
      const nextMediaType = session.page === "images" ? "📷 صورة" : "🎬 فيديو";

      await callTelegram(BOT_TOKEN, "sendMessage", {
        chat_id: chatId,
        text: `✅ تم رفع ${mediaType === "image" ? "صورة" : "فيديو"} لـ *${currentModelName}*\n\n` +
          `متبقي: *${remaining}* نموذج\n\n` +
          `▶️ التالي: *${nextModelName}*\n` +
          `🆔 \`${nextModelId}\`\n\n` +
          `أرسل ${nextMediaType} لهذا النموذج:`,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
          inline_keyboard: [[{ text: "⏭ تخطي", callback_data: "skip_model" }]],
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
