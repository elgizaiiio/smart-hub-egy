import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/lib/streamChat";
import ChatMessage from "@/components/ChatMessage";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface AgentPageLayoutProps {
  title: string;
  subtitle: string;
  systemPrompt: string;
  model?: string;
  mode?: string;
  placeholder?: string;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

const AgentPageLayout = ({
  title, subtitle, systemPrompt, model = "google/gemini-3-flash-preview",
  mode = "chat", placeholder = "Type your message...", headerActions, children
}: AgentPageLayoutProps) => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = async (firstMsg: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const t = firstMsg.slice(0, 50) || title;
    const { data } = await supabase.from("conversations").insert({ title: t, mode, model, user_id: user.id } as any).select("id").single();
    if (data) { setConversationId(data.id); return data.id; }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    const convId = await createConversation(text);
    if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: text });

    let assistantContent = "";
    const allMsgs = [
      { role: "user" as const, content: `[System]: ${systemPrompt}` },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text }
    ];

    await streamChat({
      messages: allMsgs, model, searchEnabled: true,
      onDelta: (chunk) => {
        setIsThinking(false);
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      },
      onDone: async () => {
        setIsLoading(false); setIsThinking(false);
        if (convId && assistantContent) {
          await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: assistantContent });
        }
      },
      onError: () => { setIsLoading(false); setIsThinking(false); },
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        </div>
        {headerActions}
      </div>

      {children}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground max-w-sm">{subtitle}</p>
            </div>
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
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
            style={{ minHeight: "32px" }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPageLayout;
