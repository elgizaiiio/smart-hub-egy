import { useState, useRef, useEffect } from "react";
import { ArrowLeft, BookOpen, ArrowUp, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are an AI Book & Story Creator. Create complete books with 20+ pages:
Steps:
1. First generate a Table of Contents (chapters/sections) and present for approval
2. After user approves, write the full book chapter by chapter
3. Each page should be clearly numbered: --- Page 1 ---
4. Include compelling narrative, proper formatting, and rich detail
5. Minimum 20 numbered pages
Support: novels, educational books, children's stories, self-help, technical books.
Always respond in the user's language.
Cost: 5 MC for 20 pages, +1 MC per extra 10 pages.`;

const GENRES = [
  { label: "Novel", value: "novel" },
  { label: "Educational", value: "educational" },
  { label: "Children's", value: "children" },
  { label: "Self-Help", value: "self-help" },
];

const LANGUAGES = ["Arabic", "English", "French", "Spanish"];
const PAGE_OPTIONS = [20, 30, 50];

const BookCreatorPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [genre, setGenre] = useState("novel");
  const [lang, setLang] = useState("Arabic");
  const [pages, setPages] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!isThinking) { setProgress(0); setProgressText(""); return; }
    const texts = ["Understanding your idea...", "Building structure...", "Writing chapters...", "Generating content...", "Finalizing..."];
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, texts.length - 1);
      setProgressText(texts[i]);
      setProgress(Math.min(20 * (i + 1), 95));
    }, 4000);
    return () => clearInterval(interval);
  }, [isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    setProgressText("Understanding your idea...");
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Book Creator</h1>
          </div>
          <p className="text-[10px] text-muted-foreground">5 MC / 20 pages</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-4">
              <div className="text-center">
                <BookOpen className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Book Creator</h2>
                <p className="text-xs text-muted-foreground">Create complete books and stories with AI</p>
              </div>

              {/* Genre */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Genre</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button key={g.value} onClick={() => setGenre(g.value)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${genre === g.value ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground"}`}>{g.label}</button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Language</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground"}`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Pages */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Pages: {pages}</p>
                <div className="flex gap-2">
                  {PAGE_OPTIONS.map(p => (
                    <button key={p} onClick={() => setPages(p)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${pages === p ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground"}`}>{p}+</button>
                  ))}
                </div>
              </div>

              {/* Upload existing content */}
              <button onClick={() => fileRef.current?.click()} className="w-full py-2 rounded-2xl border border-dashed border-border/50 bg-card/50 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Upload className="w-3 h-3" /> Attach existing text (optional)
              </button>

              {/* Input */}
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(`Genre: ${genre}, Language: ${lang}, Pages: ${pages}+. Topic: ${input}`); } }} placeholder="Describe your book idea..." rows={2} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5" style={{ minHeight: "48px" }} />
                <button onClick={() => sendMessage(`Genre: ${genre}, Language: ${lang}, Pages: ${pages}+. Topic: ${input}`)} disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </div>
        )}

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
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Continue or modify..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" accept=".txt,.md,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = () => sendMessage(`[Attached: ${f.name}]\n${(reader.result as string).slice(0, 8000)}\n\nExpand this into a full ${genre} book in ${lang}, ${pages}+ pages.`); reader.readAsText(f); } e.target.value = ""; }} />
    </div>
  );
};

export default BookCreatorPage;
