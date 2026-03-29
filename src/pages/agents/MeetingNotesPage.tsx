import { useState, useRef, useEffect } from "react";
import { ArrowLeft, CalendarCheck, Upload, Mic, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are a Meeting Notes AI Agent. You help users manage meetings:
- Summarize uploaded recordings (audio/video)
- Extract action items, decisions, and follow-ups
- Create structured meeting minutes
- Track action items and deadlines
Format output as structured sections: Summary, Key Decisions, Action Items (with owners), Follow-ups.
Always respond in the user's language.`;

const MeetingNotesPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [calendarConnected] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    let content = "";
    const allMsgs = [
      { role: "user" as const, content: `[System]: ${SYSTEM}` },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text }
    ];

    await streamChat({
      messages: allMsgs, model: "google/gemini-3-flash-preview", searchEnabled: false,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendMessage(`[Uploaded recording: ${file.name}] Please summarize this meeting and extract action items, decisions, and follow-ups.`);
    e.target.value = "";
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Meeting Notes</h1>
          </div>
          <p className="text-[11px] text-muted-foreground">Summarize meetings & track action items</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Meeting Notes</h2>
                <p className="text-sm text-muted-foreground">Upload a meeting recording or describe your meeting to get structured notes</p>
              </div>

              {/* Connect Calendar */}
              {!calendarConnected && (
                <button onClick={() => navigate("/settings/integrations")} className="w-full py-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                  Connect Google Calendar / Outlook
                </button>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Upload Recording</span>
                </button>
                <button onClick={() => sendMessage("Start a new meeting summary from my description")} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors">
                  <Mic className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Describe Meeting</span>
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
              <div className="prose-chat text-foreground text-sm" dir="auto">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
          <textarea value={input} onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Ask about your meetings..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" className="hidden" accept="audio/*,video/*" onChange={handleFileUpload} />
    </div>
  );
};

export default MeetingNotesPage;
