import { useState, useRef, useEffect } from "react";
import { ArrowLeft, TrendingUp, ArrowUp, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are a Market & Competitor Analyzer AI Agent. Help users understand their competitive landscape:
- Discover competitors automatically via web search
- Analyze each competitor: strengths, weaknesses, pricing, marketing strategy, reviews
- Generate SWOT analysis
- Create comparison tables
- Provide actionable recommendations
- Generate professional analysis reports
Use web search extensively to gather real data.
Always respond in the user's language.`;

const MarketAnalyzerPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [market, setMarket] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!isLoading) { setSearchProgress(0); setSearchPhase(""); return; }
    if (!isThinking) return;
    const phases = ["Searching for competitors...", "Analyzing pricing...", "Checking reviews...", "Building SWOT analysis...", "Generating report..."];
    let idx = 0;
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, phases.length - 1);
      setSearchPhase(phases[idx]);
      setSearchProgress(Math.min(20 * (idx + 1), 95));
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading, isThinking]);

  const startAnalysis = async () => {
    if (!businessName.trim() || !industry.trim()) { toast.error("Fill in at least business name and industry"); return; }
    const prompt = `Analyze the competitive landscape for: Business: "${businessName}", Industry: "${industry}", Market: "${market || "Global"}"${competitors ? `, Known competitors: ${competitors}` : ""}. Find competitors, analyze each one, create comparison table, SWOT analysis, and strategic recommendations.`;
    sendMessage(prompt);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    setSearchPhase("Starting competitive research...");
    setSearchProgress(5);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: text }],
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
          <TrendingUp className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Market Analyzer</h1>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">1 MC</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-4">
              <div className="text-center mb-4">
                <TrendingUp className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Competitor Analysis</h2>
                <p className="text-xs text-muted-foreground">Discover and analyze your market competitors</p>
              </div>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Business name *" className="w-full px-4 py-3 rounded-2xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none" />
              <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry / Field *" className="w-full px-4 py-3 rounded-2xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none" />
              <input value={market} onChange={e => setMarket(e.target.value)} placeholder="Target market (e.g. Egypt, Saudi Arabia)" className="w-full px-4 py-3 rounded-2xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none" />
              <input value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="Known competitors (optional)" className="w-full px-4 py-3 rounded-2xl bg-secondary/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none" />
              <button onClick={startAnalysis} disabled={!businessName.trim() || !industry.trim()} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-30 flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> Start Analysis
              </button>
            </motion.div>
          </div>
        )}

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
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Ask more about competitors..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketAnalyzerPage;
