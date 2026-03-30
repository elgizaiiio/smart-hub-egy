import { useState, useRef, useEffect } from "react";
import { ArrowLeft, BarChart3, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are a Social Media Analyzer. Analyze public profiles and posts:
- Detect platform automatically from URL (X, Instagram, YouTube, TikTok, Facebook, LinkedIn, Threads)
- Provide engagement metrics, follower analysis, content strategy insights
- Create structured reports: Overview, Engagement Analysis, Content Analysis, Recommendations
- Compare accounts when multiple URLs given
- Identify best posting times and trending content
Use web search extensively to gather public data.
Always respond in the user's language.
This service is FREE.`;

const PLATFORMS = "X · Instagram · YouTube · TikTok · Facebook · LinkedIn · Threads";

const SocialAnalyzerPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!isThinking) { setProgress(0); setPhase(""); setAnalyzing(false); return; }
    setAnalyzing(true);
    const phases = ["Detecting platform...", "Fetching profile data...", "Analyzing engagement...", "Generating insights..."];
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, phases.length - 1);
      setPhase(phases[i]);
      setProgress(Math.min(25 * (i + 1), 95));
    }, 2000);
    return () => clearInterval(interval);
  }, [isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setUrl(""); setInput("");
    setIsLoading(true); setIsThinking(true);
    setPhase("Detecting platform...");
    setProgress(5);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: text }],
      model: "google/gemini-3-flash-preview", searchEnabled: true,
      onDelta: (chunk) => { setIsThinking(false); setProgress(100); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
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
          <BarChart3 className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Social Analyzer</h1>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">Free</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5 w-full">
              <BarChart3 className="w-10 h-10 text-primary/30 mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Social Analyzer</h2>
              <p className="text-sm text-muted-foreground">Paste a profile or post URL for instant analysis</p>
              <p className="text-[10px] text-muted-foreground">{PLATFORMS}</p>

              <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-4 py-3">
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(`Analyze this social media profile/post: ${url}`); }} placeholder="Paste profile or post URL..." className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60" />
                <button onClick={() => sendMessage(`Analyze this social media profile/post: ${url}`)} disabled={!url.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </div>
        )}

        {analyzing && phase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">{phase}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm break-all">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && !phase && <ThinkingLoader />}
        <div ref={endRef} />
      </div>
      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Ask more or paste another URL..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAnalyzerPage;
