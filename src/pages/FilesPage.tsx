import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Eye, Download, X, Presentation, FileSpreadsheet, ScrollText, PenTool, Maximize2, Minimize2, FileText, Play, Send, Plus, Paperclip, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import SmartQuestionCard from "@/components/SmartQuestionCard";
import { buildPreviewHtml } from "@/lib/filesHtmlBuilders";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  htmlContent?: string;
}

interface AttachedFile {
  name: string;
  type: string;
  data: string;
}

interface SmartQuestion {
  title: string;
  options: string[];
  allowText?: boolean;
}

interface SavedFile {
  id: string;
  title: string;
  created_at: string;
  mode: string;
}

const FILE_SERVICES = [
  { id: "slides", label: "Slides", icon: Presentation, gradient: "from-violet-500 to-purple-600" },
  { id: "resume", label: "Resume", icon: PenTool, gradient: "from-emerald-500 to-teal-600" },
  { id: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet, gradient: "from-blue-500 to-cyan-600" },
  { id: "document", label: "Document", icon: ScrollText, gradient: "from-orange-500 to-amber-600" },
];

const FilesPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<SmartQuestion[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("conversations")
        .select("id, title, created_at, mode")
        .eq("user_id", user.id)
        .eq("mode", "files")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setSavedFiles(data as SavedFile[]);
    };
    load();
  }, []);

  useEffect(() => {
    if (isGenerating) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    const jsonBlockRegex = /```json\s*\n?([\s\S]*?)\n?```/g;
    let match;
    const questions: SmartQuestion[] = [];
    while ((match = jsonBlockRegex.exec(lastMsg.content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.type === "questions" && parsed.questions) questions.push(...parsed.questions);
      } catch {}
    }
    if (questions.length > 0) setPendingQuestions(questions);
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); return; }
      const reader = new FileReader();
      if (file.type.startsWith("image/")) {
        reader.onload = () => setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => setAttachedFiles(prev => [...prev, { name: file.name, type: file.type, data: (reader.result as string).slice(0, 10000) }]);
        reader.readAsText(file);
      }
    });
    e.target.value = "";
  };

  const createOrGetConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) || "File Generation";
    const { data } = await supabase.from("conversations").insert({ title, mode: "files", user_id: user.id } as any).select("id").single();
    if (data) { setConversationId(data.id); return data.id; }
    return null;
  };

  const loadOldConversation = async (id: string) => {
    setConversationId(id);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (msgs) {
      const loaded: ChatMsg[] = [];
      for (const m of msgs) {
        const msg: ChatMsg = { role: m.role as "user" | "assistant", content: m.content };
        if (m.role === "assistant" && m.images && m.images.length > 0) {
          try { const meta = JSON.parse(m.images[0]); if (meta.htmlContent) msg.htmlContent = meta.htmlContent; } catch {}
        }
        loaded.push(msg);
      }
      setMessages(loaded);
    }
  };

  const saveMessage = async (convId: string, role: string, content: string, htmlContent?: string) => {
    const images = htmlContent ? [JSON.stringify({ htmlContent })] : null;
    await supabase.from("messages").insert({ conversation_id: convId, role, content, images });
  };

  const handleGenerate = useCallback(async (overrideInput?: string) => {
    const userInput = overrideInput || input;
    if (!userInput.trim() && attachedFiles.length === 0) return;
    const userContent = userInput || `[Attached ${attachedFiles.length} file(s)]`;
    setMessages(prev => [...prev, { role: "user", content: userContent }]);
    setInput("");
    const files = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);
    setPendingQuestions([]);
    setStatusHistory([]);

    const convId = await createOrGetConversation(userContent);
    if (convId) await saveMessage(convId, "user", userContent);

    try {
      const AGENT_PROMPTS: Record<string, string> = {
        slides: `You are a Slides Agent. Generate a premium single-file presentation as HTML with embedded CSS and vanilla JavaScript:
- DARK themed slideshow with 10+ slides
- Full-viewport sections (100vh) with scroll-snap
- Distinct layouts, strong visual hierarchy, and polished transitions
- Professional typography, gradients, responsive spacing, and keyboard navigation
- Include comprehensive, well-researched content
Output ONLY the complete HTML code with no explanations.`,
        resume: "Generate a professional HTML resume/CV. Modern dark theme. Output ONLY HTML.",
        spreadsheet: "Generate a complete HTML table/spreadsheet. Dark theme. Output ONLY HTML.",
        document: "Generate a comprehensive HTML document. Dark theme. Include well-researched content. Output ONLY HTML.",
      };

      const agentPrompt = activeAgent && AGENT_PROMPTS[activeAgent] ? AGENT_PROMPTS[activeAgent] : "Generate a complete, well-formatted HTML document. Dark theme, professional. Output ONLY HTML.";
      let prompt = `${agentPrompt}\n\nUser request: ${userInput}`;

      // Search for images for slides
      if (activeAgent === "slides") {
        setStatusHistory(prev => [...prev, "Searching for visuals..."]);
        try {
          const { data: slideImages } = await supabase.functions.invoke("search", {
            body: { query: `${userInput} presentation visuals high quality editorial photos` },
          });
          const urls = Array.isArray(slideImages?.images) ? slideImages.images.slice(0, 4) : [];
          if (urls.length > 0) {
            prompt += `\n\nUse these visual URLs in the presentation:\n${urls.map((url: string, index: number) => `${index + 1}. ${url}`).join("\n")}`;
          }
        } catch {}
        setStatusHistory(prev => [...prev, "Generating presentation..."]);
      }

      const fileAttachments = files.filter(f => f.type !== "image");
      if (fileAttachments.length > 0) {
        prompt += "\n\n--- Attached Documents ---\n";
        fileAttachments.forEach(f => { prompt += `\n--- ${f.name} ---\n${f.data}\n`; });
      }

      const historyMessages = messages.map(m => ({ role: m.role, content: m.content }));
      const imageAttachments = files.filter(f => f.type === "image");
      let userMessage: any;
      if (imageAttachments.length > 0) {
        const content: any[] = imageAttachments.map(img => ({ type: "image_url", image_url: { url: img.data } }));
        content.push({ type: "text", text: prompt });
        userMessage = { role: "user", content };
      } else {
        userMessage = { role: "user", content: prompt };
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [...historyMessages, userMessage], model: "moonshotai/kimi-k2.5:nitro", mode: "files", searchEnabled }),
      });

      if (!resp.ok || !resp.body) {
        setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]);
        setIsGenerating(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try { const parsed = JSON.parse(jsonStr); const delta = parsed.choices?.[0]?.delta?.content; if (delta) content += delta; } catch {}
        }
      }

      const hasQuestions = content.includes('"type":"questions"') || content.includes('"type": "questions"');
      if (hasQuestions) {
        setMessages(prev => [...prev, { role: "assistant", content }]);
        if (convId) await saveMessage(convId, "assistant", content);
        setIsGenerating(false);
        return;
      }

      const html = buildPreviewHtml({ content, agent: activeAgent, request: userInput });
      const agentLabel = activeAgent ? FILE_SERVICES.find(s => s.id === activeAgent)?.label || "Document" : "Document";
      const description = `Your ${agentLabel.toLowerCase()} is ready. Tap Preview to view it.`;

      setMessages(prev => [...prev, { role: "assistant", content: description, htmlContent: html }]);
      if (convId) await saveMessage(convId, "assistant", description, html);

      // Refresh saved files
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("conversations").select("id, title, created_at, mode").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(10);
        if (data) setSavedFiles(data as SavedFile[]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]);
    }
    setIsGenerating(false);
    setStatusHistory([]);
  }, [input, attachedFiles, messages, activeAgent, searchEnabled, conversationId]);

  const handleDownloadHtml = (html: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeAgent || "document"}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  };

  const handleDownloadPdf = (html: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups"); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const newChat = () => {
    setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]);
    setConversationId(null); setActiveAgent(null); setPendingQuestions([]);
    setStatusHistory([]);
  };

  const hasMessages = messages.length > 0;

  // Input bar component (shared between empty/chat states)
  const InputBar = ({ compact }: { compact?: boolean }) => (
    <div className="w-full">
      {/* Active agent badge ABOVE the input */}
      {activeAgent && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            {FILE_SERVICES.find(s => s.id === activeAgent)?.label}
            <button onClick={() => setActiveAgent(null)} className="ml-1 hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 mb-2 px-1 flex-wrap">
          {attachedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30 text-xs text-foreground">
              <Paperclip className="w-3 h-3 text-muted-foreground" />
              <span className="truncate max-w-[100px]">{f.name}</span>
              <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={`flex items-end gap-2 rounded-2xl border border-border/40 bg-secondary/30 backdrop-blur-sm px-3 py-2 ${compact ? "" : "min-h-[56px]"}`}>
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 self-end">
          <Plus className="w-5 h-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
          placeholder="Describe what you want to create..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[24px] max-h-[160px] py-1"
          rows={1}
        />
        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating || (!input.trim() && attachedFiles.length === 0)}
          className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-all shrink-0 self-end hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout onSelectConversation={loadOldConversation} onNewChat={newChat} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background overflow-x-hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={newChat} onSelectConversation={loadOldConversation} activeConversationId={conversationId} currentMode="files" />

        {/* Preview Modal */}
        <AnimatePresence>
          {previewHtml && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-secondary/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
                  <p className="text-sm font-medium text-foreground">Preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewFullscreen(!previewFullscreen)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    {previewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDownloadHtml(previewHtml)} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors">HTML</button>
                  <button onClick={() => handleDownloadPdf(previewHtml)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">PDF</button>
                </div>
              </div>
              <div className={`flex-1 ${previewFullscreen ? "" : "p-4 md:p-8"}`}>
                <div className={previewFullscreen ? "w-full h-full" : "max-w-5xl mx-auto h-full rounded-xl overflow-hidden border border-border/20 shadow-2xl"}>
                  <iframe srcDoc={previewHtml} className="w-full h-full bg-white" sandbox="allow-scripts" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center bg-transparent border-0 text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-4 md:pb-8">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4">
              <div className="flex-1" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-xl w-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-5">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                  Create Anything
                </h1>
                <p className="text-muted-foreground mt-2 mb-8 text-sm">Slides, resumes, spreadsheets, documents — powered by AI</p>

                <div className="max-w-lg mx-auto mb-6">
                  <InputBar />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  {FILE_SERVICES.map((svc, i) => (
                    <motion.button
                      key={svc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      onClick={() => setActiveAgent(activeAgent === svc.id ? null : svc.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm ${
                        activeAgent === svc.id
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/40 border-border/30 hover:border-primary/20 text-foreground/80"
                      }`}
                    >
                      <svc.icon className="w-4 h-4" />
                      <span className="font-medium">{svc.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <div className="flex-1 flex flex-col justify-start pt-4 max-w-lg w-full px-4">
                {savedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">Recent</p>
                    {savedFiles.slice(0, 4).map((f, i) => (
                      <motion.button
                        key={f.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadOldConversation(f.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/20 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${FILE_SERVICES[i % FILE_SERVICES.length].gradient} flex items-center justify-center shrink-0 opacity-60`}>
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                        </div>
                        <Play className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-4 px-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[80%] bg-secondary/70 text-foreground px-4 py-2.5 rounded-[1.6rem] rounded-br-md text-sm leading-relaxed border border-border/30">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="mb-4 space-y-3">
                      <div className="prose-chat text-foreground text-sm">
                        <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "").replace(/```html[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim()}</ReactMarkdown>
                      </div>
                      {msg.htmlContent && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setPreviewHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                            <Eye className="w-4 h-4" /> Preview
                          </button>
                          <button onClick={() => handleDownloadHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border/30 text-foreground text-sm hover:bg-accent transition-colors">
                            <Download className="w-4 h-4" /> HTML
                          </button>
                          <button onClick={() => handleDownloadPdf(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border/30 text-foreground text-sm hover:bg-accent transition-colors">
                            <Download className="w-4 h-4" /> PDF
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {pendingQuestions.length > 0 && !isGenerating && (
                <SmartQuestionCard
                  questions={pendingQuestions}
                  onAnswer={(answer) => { setPendingQuestions([]); setInput(answer); setTimeout(() => handleGenerate(answer), 50); }}
                />
              )}
              {isGenerating && <ThinkingLoader searchStatus={statusHistory[statusHistory.length - 1] || "Working..."} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {hasMessages && (
          <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-2xl mx-auto">
              <InputBar compact />
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,image/*" multiple className="hidden" onChange={handleFileAttach} />
      </div>
    </AppLayout>
  );
};

export default FilesPage;
