type MsgContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
type Msg = { role: "user" | "assistant"; content: MsgContent };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export async function streamChat({
  messages,
  model,
  searchEnabled,
  deepResearch,
  onDelta,
  onDone,
  onError,
  onImages,
  signal,
}: {
  messages: Msg[];
  model?: string;
  searchEnabled?: boolean;
  deepResearch?: boolean;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
  onImages?: (images: string[]) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, model, searchEnabled, deepResearch }),
      signal,
    });

    if (resp.status === 429) {
      onError?.("Rate limit exceeded. Please wait a moment and try again.");
      onDone();
      return;
    }
    if (resp.status === 402) {
      onError?.("Credits depleted. Please add more credits to continue.");
      onDone();
      return;
    }
    if (!resp.ok || !resp.body) {
      onError?.("Failed to connect to AI. Please try again.");
      onDone();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          // Check for images from search
          if (parsed.images && Array.isArray(parsed.images)) {
            onImages?.(parsed.images);
          }
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e: any) {
    if (e?.name === "AbortError") {
      onDone();
      return;
    }
    console.error("Stream error:", e);
    onError?.("Connection error. Please check your internet and try again.");
    onDone();
  }
}
