import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Youtube, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are a YouTube Video Summarizer. When given a URL:
1. Extract the video ID
2. Use web search to find transcript/content
3. Provide structured summary: Key Points, Timestamps (if available), Full Summary
4. Allow follow-up questions
Always respond in the user's language.`;

const extractVideoId = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
};

const YoutubeSummaryPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const vid = extractVideoId(text);
    if (vid) setVideoId(vid);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setUrl(""); setInput("");
    setIsLoading(true); setIsThinking(true);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: text }],
      model: "google/gemini-3-flash-preview", searchEnabled: true,
      onDelta: (chunk) => { setIsThinking(false); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: () => { setIsLoading(false); setIsThinking(false); toast.error("Failed"); },
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" />
          <h1 className="text-sm font-semibold text-foreground">YouTube Summary</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5 w-full">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto"><Youtube className="w-8 h-8 text-red-500" /></div>
              <h2 className="text-lg font-bold text-foreground">YouTube Summary</h2>
              <p className="text-sm text-muted-foreground">Paste a YouTube URL to get an instant summary</p>

              <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-4 py-3">
                <Youtube className="w-5 h-5 text-red-500/50 shrink-0" />
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(url); }} placeholder="https://youtube.com/watch?v=..." className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60" />
                <button onClick={() => sendMessage(url)} disabled={!url.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>

              {/* Preview thumbnail if URL pasted */}
              {extractVideoId(url) && (
                <div className="rounded-2xl overflow-hidden">
                  <img src={`https://img.youtube.com/vi/${extractVideoId(url)}/maxresdefault.jpg`} alt="" className="w-full object-cover" />
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Show thumbnail at top if videoId known */}
        {hasMessages && videoId && messages.length <= 2 && (
          <div className="rounded-2xl overflow-hidden mb-3">
            <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="" className="w-full object-cover rounded-2xl" />
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm break-all">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>
      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Ask about this video..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeSummaryPage;
