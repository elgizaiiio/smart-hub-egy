import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, ArrowUp, Loader2, Globe, Paperclip, MessageSquare } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  type?: "plan" | "build" | "log";
}

const CodeWorkspace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<"plan" | "build">("plan");
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send initial prompt
  useEffect(() => {
    if (prompt && messages.length === 0) {
      handleSend(prompt);
    }
  }, [prompt]);

  const handleSend = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading) return;
    
    const userMsg: ChatMsg = { role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput("");
    setIsLoading(true);
    setIsThinking(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";
    const systemPrompt = mode === "plan" 
      ? "You are Megsy Code, a coding assistant. The user wants to build something. Analyze their request, explain what you understand they want, outline a plan of what you'll create (files, features, tech stack), and ask if they want to proceed. Be conversational and friendly. Do not use emoji. Respond in the user's language."
      : "You are Megsy Code, a coding assistant in build mode. You are actively building the project. Show progress like: Reading file X... Writing file Y... Creating component Z... After completing, summarize what was created and suggest next steps. Do not use emoji. Respond in the user's language.";

    const allMessages = messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }));
    allMessages.unshift({ role: "user" as const, content: `[System]: ${systemPrompt}` });

    await streamChat({
      messages: allMessages,
      model: "x-ai/grok-3",
      onDelta: (chunk) => {
        setIsThinking(false);
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { role: "assistant", content: assistantContent, type: mode }];
        });
      },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: (err) => { toast.error(err); setIsLoading(false); setIsThinking(false); },
      signal: controller.signal,
    });
  };

  const handleApprove = async () => {
    // Switch to build mode and send approval
    setMode("build");
    const approvalMsg: ChatMsg = { role: "user", content: "Plan approved" };
    setMessages(prev => [...prev, approvalMsg]);
    setIsLoading(true);
    setIsThinking(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    const allMessages = messages.concat(approvalMsg).map(m => ({ role: m.role, content: m.content }));
    allMessages.unshift({ role: "user" as const, content: "[System]: You are Megsy Code in build mode. The user approved the plan. Now build the project. Show progress: Reading files... Writing files... Creating components... After completion, summarize and suggest next steps. Do not use emoji." });

    await streamChat({
      messages: allMessages,
      model: "x-ai/grok-3",
      onDelta: (chunk) => {
        setIsThinking(false);
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { role: "assistant", content: assistantContent, type: "build" }];
        });
      },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: (err) => { toast.error(err); setIsLoading(false); setIsThinking(false); },
      signal: controller.signal,
    });
  };

  const lastAssistantIsPlan = messages.length > 0 && 
    messages[messages.length - 1]?.role === "assistant" && 
    mode === "plan" && !isLoading;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      {activeTab === "chat" && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <button onClick={() => navigate("/code")} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-muted-foreground">{mode === "plan" ? "Chat Mode" : "Build Mode"}</span>
          <div className="w-8" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "chat" ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="prose-chat text-foreground text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
                <ThinkingLoader />
              )}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
                <ThinkingLoader />
              )}
              {/* Approve plan button */}
              {lastAssistantIsPlan && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Approve Plan
                </button>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="shrink-0 px-4 py-3 max-w-3xl mx-auto w-full">
              <div className="relative">
                <AnimatedPlusMenu
                  open={menuOpen}
                  onToggle={() => setMenuOpen(!menuOpen)}
                  onClose={() => setMenuOpen(false)}
                  mode={mode}
                  onModeChange={(m) => { setMode(m); setMenuOpen(false); }}
                />
                <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask about your project..."
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
                    style={{ minHeight: "32px" }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-secondary">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Preview will appear here</p>
              <p className="text-xs text-muted-foreground mt-1">Your project is being built...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom tabs - no icons */}
      <div className="flex border-t border-border">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
            activeTab === "chat" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
            activeTab === "preview" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          Preview
        </button>
      </div>
    </div>
  );
};

// Plus menu for code workspace
import { AnimatePresence, motion } from "framer-motion";

const AnimatedPlusMenu = ({ open, onToggle, onClose, mode, onModeChange }: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  mode: "plan" | "build";
  onModeChange: (m: "plan" | "build") => void;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <div className="fixed inset-0 z-30" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56"
        >
          <button
            onClick={() => onModeChange("plan")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${mode === "plan" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
          >
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm">Chat Mode</p>
              <p className="text-[10px] text-muted-foreground">Plan before building</p>
            </div>
            {mode === "plan" && <span className="ml-auto text-xs text-primary">On</span>}
          </button>
          <div className="border-t border-border mt-1 pt-1">
            <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Connect</p>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
              <Globe className="w-4 h-4 text-muted-foreground" /> GitHub
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
              <Paperclip className="w-4 h-4 text-muted-foreground" /> Supabase
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default CodeWorkspace;
