import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Podcast, ArrowUp, Loader2, Globe2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are an AI Podcast Creator. Help users create professional podcasts:
- Research topics using web search
- Write engaging podcast scripts with natural dialogue
- Support multiple voices and languages
- Create episode outlines and show notes
Steps: 1) Understand topic 2) Research 3) Write script 4) Present for approval
Always respond in the user's language.`;

const LANGUAGES = ["English", "Arabic", "Spanish", "French", "German"];

const PodcastAgentPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("English");
  const [speakers, setSpeakers] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}\nLanguage: ${lang}, Speakers: ${speakers}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: text }],
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
          <Podcast className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">AI Podcast</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5 w-full">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Podcast className="w-8 h-8 text-primary" /></div>
              <h2 className="text-lg font-bold text-foreground">AI Podcast Creator</h2>
              <p className="text-sm text-muted-foreground">Create professional podcast episodes with AI</p>

              {/* Language */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Globe2 className="w-3 h-3" /> Language</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground hover:bg-accent"}`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Speakers */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Speakers: {speakers}</p>
                <input type="range" min={1} max={4} value={speakers} onChange={e => setSpeakers(Number(e.target.value))} className="w-full accent-primary" />
              </div>

              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="What's the podcast topic?" rows={2} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5" style={{ minHeight: "48px" }} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>
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
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Continue..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastAgentPage;
