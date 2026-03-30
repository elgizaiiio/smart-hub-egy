import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowUp, Loader2, Plus, Image, FileUp, X, ChevronDown, SearchCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
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

const LEVELS: { id: SearchLevel; label: string; desc: string }[] = [
  { id: "fast", label: "Fast", desc: "5-10 sources, ~1 min" },
  { id: "deep", label: "Deep", desc: "20-30 sources, ~3 min" },
  { id: "comprehensive", label: "Comprehensive", desc: "50+ sources, ~5+ min" },
];

const PegtopIcon = ({ className }: {className?: string}) =>
  <svg className={className} width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </svg>;

const DeepSearchPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<SearchLevel>("deep");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState("");
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{name: string; type: string; data: string}[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
        reader.readAsDataURL(file);
      } else {
        file.text().then(text => {
          setAttachedFiles(prev => [...prev, { name: file.name, type: "file", data: text.slice(0, 8000) }]);
        });
      }
    });
    e.target.value = "";
    setShowAttachMenu(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const prompt = `[Research Level: ${level}] ${text}`;
    
    let fullContent = text;
    if (attachedFiles.length > 0) {
      const fileTexts = attachedFiles.filter(f => f.type === "file").map(f => `--- File: ${f.name} ---\n${f.data}`).join("\n\n");
      if (fileTexts) fullContent += "\n\n" + fileTexts;
    }
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true); setIsThinking(true);
    setSearchPhase("Analyzing query...");
    setSearchProgress(5);
    let content = "";
    
    const allMessages = [
      { role: "user" as const, content: `[System]: ${SYSTEM}` },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: `[Research Level: ${level}] ${fullContent}` }
    ];

    await streamChat({
      messages: allMessages,
      model: "google/gemini-3-flash-preview", searchEnabled: true, deepResearch: true,
      onDelta: (chunk) => {
        setIsThinking(false); setSearchProgress(100);
        content += chunk;
        setMessages(prev => {
          const l = prev[prev.length-1];
          if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m);
          return [...prev, {role:"assistant",content}];
        });
      },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: (err) => {
        setIsLoading(false); setIsThinking(false);
        if (err.includes("429")) toast.error("Rate limit exceeded. Please try again later.");
        else if (err.includes("402")) toast.error("Insufficient credits. Please add funds.");
        else toast.error("Research failed. Please try again.");
      },
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header - same style as slides */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
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
              {/* Center: title with star + hero image */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <PegtopIcon className="text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Megsy Deep Search</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Multi-source research with cross-referencing</p>
                
                {/* Hero image */}
                <div className="rounded-2xl overflow-hidden mb-4 mx-auto max-w-[280px]">
                  <img src="/deep-search-hero.png" alt="Deep Search" className="w-full h-auto" />
                </div>
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
            {msg.role === "user" ? (
              <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div>
            ) : (
              <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
            )}
          </div>
        ))}
        {isThinking && !searchPhase && <ThinkingLoader />}
        <div ref={endRef} />
      </div>

      {/* Bottom input bar */}
      <div className="shrink-0 px-4 py-3">
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground border border-border shrink-0">
                {f.type === "image" ? <img src={f.data} alt="" className="w-8 h-8 rounded object-cover" /> : <FileUp className="w-3 h-3" />}
                <span className="truncate max-w-[100px]">{f.name}</span>
                <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
          {/* + button for attach */}
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setShowAttachMenu(false)} />
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full mb-2 left-0 z-[46] rounded-xl border border-border/30 bg-black/80 backdrop-blur-2xl p-2 shadow-xl w-40">
                    <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-white/5 transition-colors">
                      <Image className="w-4 h-4 text-white/50" />
                      Images
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-white/5 transition-colors">
                      <FileUp className="w-4 h-4 text-white/50" />
                      Files
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Level selector button */}
          <div className="relative">
            <button onClick={() => setShowLevelMenu(!showLevelMenu)} className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-accent/50 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {level === "fast" ? "Fast" : level === "deep" ? "Deep" : "Full"}
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showLevelMenu && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setShowLevelMenu(false)} />
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full mb-2 left-0 z-[46] rounded-xl border border-border/30 bg-black/80 backdrop-blur-2xl p-1.5 shadow-xl w-52">
                    {LEVELS.map(l => (
                      <button key={l.id} onClick={() => { setLevel(l.id); setShowLevelMenu(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${level === l.id ? "bg-primary/15 text-primary" : "text-white/70 hover:bg-white/5"}`}>
                        <p className="font-medium">{l.label}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{l.desc}</p>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={hasMessages ? "Research more..." : "What would you like to research?"}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
            style={{ minHeight: "32px" }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/30 mt-2">Powered by Lovable AI</p>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json,.doc,.docx" multiple />
      <input ref={imageInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*" multiple />
    </div>
  );
};

export default DeepSearchPage;
