import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Presentation, ArrowUp, Loader2, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are an AI Slides Creator. Create professional presentations:
- Generate slide content with structured layouts (title, bullets, speaker notes)
- Support multiple languages
- Create 5-20 slides based on the topic
- Output each slide clearly numbered with Title, Content, and Speaker Notes
When done, tell the user their presentation is ready.
Always respond in the user's language.`;

const TEMPLATES = [
  { label: "Business Pitch", prompt: "Create a 10-slide business pitch presentation" },
  { label: "Project Report", prompt: "Create a project status report presentation" },
  { label: "Educational", prompt: "Create an educational lesson presentation" },
  { label: "Marketing Plan", prompt: "Create a marketing strategy presentation" },
];

const SlidesAgentPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    let content = "";
    await streamChat({
      messages: [
        { role: "user" as const, content: `[System]: ${SYSTEM}` },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text }
      ],
      model: "google/gemini-3-flash-preview", searchEnabled: true,
      onDelta: (chunk) => {
        setIsThinking(false);
        content += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          return [...prev, { role: "assistant", content }];
        });
      },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: () => { setIsLoading(false); setIsThinking(false); toast.error("Failed"); },
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">AI Slides</h1>
          </div>
          <p className="text-[11px] text-muted-foreground">Create professional presentations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-6 w-full">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Presentation className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Create a Presentation</h2>
                <p className="text-sm text-muted-foreground">Describe your topic and I'll generate slides</p>
              </div>

              {/* Templates */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.label} onClick={() => sendMessage(t.prompt)} className="py-3 px-3 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors text-left">
                      <Layout className="w-4 h-4 text-muted-foreground mb-1" />
                      <p className="text-xs font-medium text-foreground">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input in center */}
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="What's your presentation about?" rows={2} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5" style={{ minHeight: "48px" }} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
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
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>

      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Modify or add slides..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidesAgentPage;
