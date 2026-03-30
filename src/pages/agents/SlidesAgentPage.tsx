import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Presentation, ArrowUp, Loader2, ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are an AI Slides Creator. Create professional presentations:
- Generate slide content with structured layouts (title, bullets, speaker notes)
- Number each slide clearly: Slide 1, Slide 2, etc.
- Include Title, Content (bullet points), and Speaker Notes for each slide
- Create compelling visual descriptions for each slide
- Support multiple languages
Output format: Each slide as "## Slide N: [Title]" followed by content and notes.
Always respond in the user's language.`;

const STYLES = ["Professional", "Educational", "Marketing", "Creative"];
const SLIDE_COUNTS = [5, 10, 15, 20];

const TEMPLATES = [
  { label: "Business Pitch", prompt: "Create a business pitch presentation" },
  { label: "Project Report", prompt: "Create a project status report presentation" },
  { label: "Lesson Plan", prompt: "Create an educational lesson presentation" },
  { label: "Marketing Strategy", prompt: "Create a marketing strategy presentation" },
];

const SlidesAgentPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("Professional");
  const [slideCount, setSlideCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!isThinking) { setProgress(0); setProgressText(""); return; }
    const texts = ["Analyzing topic...", "Generating content...", "Creating slides...", "Adding visuals...", "Finalizing..."];
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, texts.length - 1);
      setProgressText(texts[i]);
      setProgress(Math.min(20 * (i + 1), 95));
    }, 2500);
    return () => clearInterval(interval);
  }, [isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const fullPrompt = `${text}\n\nStyle: ${style}, Number of slides: ${slideCount}`;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    setProgressText("Analyzing topic...");
    setProgress(5);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: fullPrompt }],
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">AI Slides</h1>
          </div>
          <p className="text-[10px] text-muted-foreground">1 MC / 10 slides</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-5">
              <div className="text-center">
                <Presentation className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Create a Presentation</h2>
                <p className="text-xs text-muted-foreground">Describe your topic and choose a style</p>
              </div>

              {/* Settings toggle */}
              <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-card border border-border/30 text-xs font-medium text-muted-foreground">
                <span>Style: {style} · {slideCount} slides</span>
                <Plus className={`w-4 h-4 transition-transform ${showSettings ? "rotate-45" : ""}`} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Style</p>
                      <div className="flex flex-wrap gap-2">
                        {STYLES.map(s => (
                          <button key={s} onClick={() => setStyle(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${style === s ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Slides: {slideCount}</p>
                      <div className="flex gap-2">
                        {SLIDE_COUNTS.map(n => (
                          <button key={n} onClick={() => setSlideCount(n)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${slideCount === n ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground"}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Templates */}
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => sendMessage(t.prompt)} className="py-3 px-3 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors text-left">
                    <p className="text-xs font-medium text-foreground">{t.label}</p>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="What's your presentation about?" rows={2} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5" style={{ minHeight: "48px" }} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Loading progress */}
        {isThinking && progressText && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">{progressText}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && !progressText && <ThinkingLoader />}
        <div ref={endRef} />
      </div>

      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Modify or add slides..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidesAgentPage;
