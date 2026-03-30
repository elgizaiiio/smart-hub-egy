import { useState, useRef, useEffect } from "react";
import { ArrowLeft, SearchCheck, ArrowUp, Loader2, AlertTriangle, Zap, Search, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Message { role: "user" | "assistant"; content: string; }

type SearchLevel = "fast" | "deep" | "comprehensive";

const SYSTEM = `You are a Deep Search & Research Agent. Conduct thorough multi-source research:
- Search across web, academic, news, forums, and social media
- Cross-reference for accuracy and identify contradictions
- Compile comprehensive reports with:
  Executive Summary, Key Findings, Detailed Analysis by topic, Sources & References (with URLs), Recommendations
- Include citation numbers [1], [2] etc.
- For deep/comprehensive: analyze 20-50+ sources
Always respond in the user's language.
Cost: 1 MC per research.`;

const LEVELS: { id: SearchLevel; label: string; desc: string; icon: typeof Zap; time: string }[] = [
  { id: "fast", label: "Fast", desc: "5-10 sources, ~1 min", icon: Zap, time: "~1 min" },
  { id: "deep", label: "Deep", desc: "20-30 sources, ~3 min", icon: Search, time: "~3 min" },
  { id: "comprehensive", label: "Comprehensive", desc: "50+ sources, ~5+ min", icon: BookOpen, time: "5+ min" },
];

const DeepSearchPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<SearchLevel>("deep");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!isThinking) { setSearchProgress(0); setSearchPhase(""); return; }
    const phases = ["Analyzing query...", "Searching web sources...", "Reading articles...", "Cross-referencing data...", "Compiling report..."];
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, phases.length - 1);
      setSearchPhase(phases[i]);
      setSearchProgress(Math.min(20 * (i + 1), 95));
    }, 3000);
    return () => clearInterval(interval);
  }, [isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const prompt = `[Research Level: ${level}] ${text}`;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    setSearchPhase("Analyzing query...");
    setSearchProgress(5);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: prompt }],
      model: "google/gemini-3-flash-preview", searchEnabled: true, deepResearch: true,
      onDelta: (chunk) => { setIsThinking(false); setSearchProgress(100); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
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
          <SearchCheck className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Deep Search</h1>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">1 MC</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-5">
              <div className="text-center">
                <SearchCheck className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Deep Search</h2>
                <p className="text-xs text-muted-foreground">Multi-source research with cross-referencing</p>
              </div>

              {/* Research levels */}
              <div className="space-y-2">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-colors text-left ${level === l.id ? "bg-primary/5 border-primary/30" : "bg-card border-border/30 hover:border-primary/20"}`}>
                    <l.icon className={`w-5 h-5 ${level === l.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.desc}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{l.time}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-4 py-3">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="What do you want to research?" rows={3} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1" style={{ minHeight: "64px" }} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Live search progress */}
        {isThinking && searchPhase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">{searchPhase}</span>
            </div>
            <Progress value={searchProgress} className="h-2" />
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && !searchPhase && <ThinkingLoader />}
        <div ref={endRef} />
      </div>
      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Research more..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepSearchPage;
