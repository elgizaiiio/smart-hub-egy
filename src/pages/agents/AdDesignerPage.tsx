import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Megaphone, Upload, Link2, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are an AI Ad Designer. Create professional advertisements:
- Accept product images or URLs
- Fetch product info from URLs using web search
- Write compelling ad copy
- Support multiple platforms (Instagram, TikTok, Facebook, YouTube)
- Support multiple formats (image, video, carousel)
Always respond in the user's language.`;

const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube"];

const AdDesignerPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput(""); setProductUrl("");
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
          <Megaphone className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Ad Designer</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5 w-full">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Megaphone className="w-8 h-8 text-primary" /></div>
              <h2 className="text-lg font-bold text-foreground">Ad Designer</h2>
              <p className="text-sm text-muted-foreground">Upload a product image or paste a link to get started</p>

              {/* Two options */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => fileRef.current?.click()} className="py-6 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Upload Image</span>
                </button>
                <button onClick={() => document.getElementById("url-input")?.focus()} className="py-6 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors flex flex-col items-center gap-2">
                  <Link2 className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Paste URL</span>
                </button>
              </div>

              {/* URL Input */}
              <input id="url-input" value={productUrl} onChange={e => setProductUrl(e.target.value)} placeholder="Paste product URL..." className="w-full px-4 py-3 rounded-2xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none" />

              {/* Platform selector */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Target Platform</p>
                <div className="flex gap-2 justify-center">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setSelectedPlatform(p)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedPlatform === p ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground hover:bg-accent"}`}>{p}</button>
                  ))}
                </div>
              </div>

              <button onClick={() => sendMessage(`Create an ad for ${selectedPlatform || "social media"}. Product: ${productUrl || "as described"}`)} disabled={!productUrl.trim() && !selectedPlatform} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-30">Create Ad</button>
            </motion.div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>
      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Adjust the ad..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) sendMessage(`[Uploaded product image: ${f.name}] Create an ad for ${selectedPlatform || "social media"}`); e.target.value = ""; }} />
    </div>
  );
};

export default AdDesignerPage;
