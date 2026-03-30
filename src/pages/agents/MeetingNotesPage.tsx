import { useState, useRef, useEffect } from "react";
import { ArrowLeft, CalendarCheck, Upload, Mic, ArrowUp, Loader2, Video, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are a Meeting Notes AI Agent. You help users manage meetings:
- Summarize uploaded recordings (audio/video)
- Extract action items with owners and deadlines
- Extract key decisions made
- Create structured meeting minutes with sections:
  Executive Summary, Key Decisions, Action Items (with owner & deadline), Follow-ups, Attendees
- Track action items across meetings
Always respond in the user's language.
Cost: 5 MC per hour of meeting.`;

const MeetingNotesPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [upcomingMeetings] = useState<{ title: string; time: string; platform: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    let content = "";
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: text }],
      model: "google/gemini-3-flash-preview", searchEnabled: false,
      onDelta: (chunk) => { setIsThinking(false); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: () => { setIsLoading(false); setIsThinking(false); toast.error("Failed"); },
    });
  };

  const hasMessages = messages.length > 0;

  // First-time: connect calendar
  if (!calendarConnected && !hasMessages) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-3 shrink-0">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Meeting Notes</h1>
          </div>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">5 MC/hr</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5">
            <CalendarCheck className="w-12 h-12 text-primary/30 mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Connect Your Calendar</h2>
            <p className="text-sm text-muted-foreground">Link your calendar so we can auto-join and summarize your meetings</p>
            <div className="space-y-2">
              <button onClick={() => { setCalendarConnected(true); toast.success("Calendar connected"); }} className="w-full py-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                Connect Google Calendar
              </button>
              <button onClick={() => { setCalendarConnected(true); toast.success("Calendar connected"); }} className="w-full py-3 rounded-2xl border border-dashed border-border/50 bg-secondary/50 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                Connect Outlook
              </button>
            </div>
            <button onClick={() => setCalendarConnected(true)} className="text-xs text-muted-foreground underline">Skip for now</button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Meeting Notes</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Upcoming meetings */}
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Next Meeting</h3>
                {upcomingMeetings.map((m, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                    <Video className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.time} · {m.platform}</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-primary-foreground">Enable Bot</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-border/30 text-center">
                <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No upcoming meetings</p>
              </div>
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
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Ask about meetings..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
        </div>
      </div>

      <input ref={fileRef} type="file" className="hidden" accept="audio/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) sendMessage(`[Uploaded recording: ${f.name}] Summarize this meeting with action items, decisions, and follow-ups.`); e.target.value = ""; }} />
    </div>
  );
};

export default MeetingNotesPage;
