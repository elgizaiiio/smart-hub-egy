import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Bot, Link2, ListTodo, Bell, MessageCircle, ArrowUp, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

type Tab = "chat" | "connect" | "tasks" | "alerts";

const SYSTEM = `You are a Personal AI Assistant named "Megsy Assistant". You're like a real friend:
- Remember everything from past conversations
- Proactively remind about upcoming meetings, tasks, deadlines
- Manage calendar, emails, and tasks via natural language
- Be warm, friendly, and encouraging
- Generate daily morning summaries
- Help draft emails and manage schedules
Always respond in the user's language.`;

const SERVICES = [
  { name: "Google Calendar", icon: "📅", connected: false },
  { name: "Gmail", icon: "📧", connected: false },
  { name: "Outlook", icon: "📨", connected: false },
  { name: "Todoist", icon: "✓", connected: false },
];

const PersonalAssistantPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [tasks, setTasks] = useState<{ text: string; done: boolean }[]>([
    { text: "Setup your assistant preferences", done: false },
  ]);
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
      model: "google/gemini-3-flash-preview", searchEnabled: true,
      onDelta: (chunk) => { setIsThinking(false); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: () => { setIsLoading(false); setIsThinking(false); toast.error("Failed"); },
    });
  };

  const TABS: { id: Tab; icon: typeof Link2; label: string }[] = [
    { id: "connect", icon: Link2, label: "Connect" },
    { id: "tasks", icon: ListTodo, label: "Tasks" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "chat", icon: MessageCircle, label: "Chat" },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Personal Assistant</h1>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">20 MC/mo</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "connect" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Connect your accounts</h3>
            <p className="text-xs text-muted-foreground">Link your services so your assistant can help manage your schedule, emails, and tasks.</p>
            <div className="space-y-2">
              {SERVICES.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/30">
                  <span className="text-lg">{s.icon}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
                  <button onClick={() => { navigate("/settings/integrations"); }} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-primary-foreground">Connect</button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "tasks" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
            {tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/30">
                <button onClick={() => setTasks(prev => prev.map((tk, idx) => idx === i ? { ...tk, done: !tk.done } : tk))} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${t.done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                  {t.done && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
              </div>
            ))}
            <button onClick={() => setTasks(prev => [...prev, { text: "New task", done: false }])} className="w-full py-2 text-xs text-primary font-medium">+ Add task</button>
          </motion.div>
        )}

        {tab === "alerts" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          </motion.div>
        )}

        {tab === "chat" && (
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Bot className="w-12 h-12 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground text-center max-w-xs">Hi! I'm your personal assistant. Connect your accounts first, then ask me anything about your schedule, emails, or tasks.</p>
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
        )}
      </div>

      {tab === "chat" && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Ask your assistant..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}

      {/* Bottom tabs */}
      <div className="shrink-0 border-t border-border/30 bg-background px-2 py-1.5 flex justify-around">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
            <t.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonalAssistantPage;
