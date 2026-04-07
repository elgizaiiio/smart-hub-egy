import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Loader2, Eye, Download, X, Globe, Image, FileText, Presentation, FileSpreadsheet, ScrollText, PenTool, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import AgentBadge from "@/components/AgentBadge";
import MentionDropdown from "@/components/MentionDropdown";
import SmartQuestionCard from "@/components/SmartQuestionCard";
import type { AgentDef } from "@/lib/agentRegistry";

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
const FILE_SERVICES = [
  { id: "slides", label: "Slides", icon: Presentation, prompt: "Create a professional presentation about" },
  { id: "resume", label: "Resume", icon: PenTool, prompt: "Create a professional resume for" },
  { id: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet, prompt: "Create a spreadsheet for" },
  { id: "document", label: "Document", icon: ScrollText, prompt: "Write a professional document about" },
];

const FILE_PLACEHOLDERS = [
  "Write a professional business proposal...",
  "Create a detailed report about...",
  "Create a structured presentation about...",
  "Summarize this document for me...",
];

const FilesPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [pendingQuestions, setPendingQuestions] = useState<SmartQuestion[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const inputRef2 = useRef(input);
  useEffect(() => { inputRef2.current = input; }, [input]);

  useEffect(() => {
    if (inputRef2.current) { setDisplayedPlaceholder(""); return; }
    const target = FILE_PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (inputRef2.current) { clearInterval(t); setDisplayedPlaceholder(""); return; }
      if (i < target.length) { setDisplayedPlaceholder(target.slice(0, i + 1)); i++; }
      else { clearInterval(t); setTimeout(() => setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length), 2500); }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx]);

  useEffect(() => {
    if (input) setDisplayedPlaceholder("");
    else setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length);
  }, [input]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "32px";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [input]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Parse smart questions from AI response
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
        if (parsed.type === "questions" && parsed.questions) {
          questions.push(...parsed.questions);
        }
      } catch {}
    }
    if (questions.length > 0) setPendingQuestions(questions);
  }, [messages, isGenerating]);

  const handleQuestionAnswer = (answer: string) => {
    setPendingQuestions([]);
    setInput(answer);
    setTimeout(() => handleGenerate(answer), 50);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); return; }
      if (type === "image") {
        const reader = new FileReader();
        reader.onload = () => { setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]); toast.success(`${file.name} attached`); };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => { setAttachedFiles(prev => [...prev, { name: file.name, type: file.type, data: (reader.result as string).slice(0, 10000) }]); toast.success(`${file.name} attached`); };
        reader.readAsText(file);
      }
    });
    e.target.value = "";
  };

  const removeAttachment = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

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

  const handleGenerate = async (overrideInput?: string) => {
    const userInput = overrideInput || input;
    if (!userInput.trim() && attachedFiles.length === 0) return;
    const userContent = userInput || `[Attached ${attachedFiles.length} file(s)]`;
    const userMsg: ChatMsg = { role: "user", content: userContent };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    const files = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);
    setPendingQuestions([]);

    const convId = await createOrGetConversation(userContent);
    if (convId) await saveMessage(convId, "user", userContent);

    try {
      const AGENT_PROMPTS: Record<string, string> = {
        slides: `Generate a complete HTML presentation with these requirements:
- Create a DARK themed slideshow with at least 10 slides
- Each slide must be a full-viewport section (100vh) with smooth scroll-snap
- Include navigation buttons (prev/next) and slide counter
- Use professional typography, gradients, and subtle animations
- Include a title slide, content slides with bullet points, data visualization slides, and a closing slide
- Add CSS transitions between slides
- Make it responsive
- Use a color scheme: dark background (#0a0a0f), primary accent (violet/purple), white text
- Include JavaScript for keyboard navigation (arrow keys)
Output ONLY the complete HTML code.`,
        resume: "Generate a professional, well-structured HTML resume/CV. Include sections for contact info, summary, experience, education, skills. Use modern, clean styling with good typography. Dark theme with accent colors. Output ONLY the HTML code.",
        spreadsheet: "Generate a complete HTML table/spreadsheet with proper styling, alternating row colors, sortable headers, and professional formatting. Dark theme. Include sample data relevant to the request. Output ONLY the HTML code.",
        document: "Generate a complete, well-formatted, comprehensive and detailed HTML document with proper headings, paragraphs, and professional styling. Dark theme. Output ONLY the HTML code.",
      };
      const agentPrompt = activeAgent && AGENT_PROMPTS[activeAgent] ? AGENT_PROMPTS[activeAgent] : "Generate a complete, well-formatted, comprehensive and detailed HTML document. Include proper styling with CSS, dark theme, make it look professional. Output ONLY the HTML code, no explanations.";
      let prompt = `${agentPrompt}\n\nUser request: ${userInput}`;
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

      const allMessages = [...historyMessages, userMessage];
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, model: "claude-haiku-4-5", mode: "files", searchEnabled }),
      });

      if (!resp.ok || !resp.body) { setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]); setIsGenerating(false); return; }

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

      let html = content;
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) html = htmlMatch[1];

      // Get natural AI description
      const descResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `The user asked: "${userInput}". I created an HTML ${activeAgent || "document"} for them. Write a natural, contextual description of what was created and suggest 2-3 specific improvements. Be conversational and specific to the content. 2-4 sentences. No emoji. Respond in the user's language.` }],
          model: "claude-haiku-4-5"
        }),
      });

      let description = "Your document is ready. Click Preview to view it.";
      if (descResp.ok && descResp.body) {
        const descReader = descResp.body.getReader();
        let descContent = "";
        let descBuffer = "";
        while (true) {
          const { done, value } = await descReader.read();
          if (done) break;
          descBuffer += decoder.decode(value, { stream: true });
          let ni: number;
          while ((ni = descBuffer.indexOf("\n")) !== -1) {
            let ln = descBuffer.slice(0, ni);
            descBuffer = descBuffer.slice(ni + 1);
            if (ln.endsWith("\r")) ln = ln.slice(0, -1);
            if (!ln.startsWith("data: ")) continue;
            const js = ln.slice(6).trim();
            if (js === "[DONE]") break;
            try { const p = JSON.parse(js); const c = p.choices?.[0]?.delta?.content; if (c) descContent += c; } catch {}
          }
        }
        if (descContent.trim()) description = descContent.trim();
      }

      setMessages(prev => [...prev, { role: "assistant", content: description, htmlContent: html }]);
      if (convId) await saveMessage(convId, "assistant", description, html);
    } catch {
      const failMsg = "Generation failed. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: failMsg }]);
      if (convId) await saveMessage(convId, "assistant", failMsg);
    }
    setIsGenerating(false);
  };

  const handleDownloadHtml = (html: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activeAgent || "document"}.html`;
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

  const hasMessages = messages.length > 0;

  // Input bar component (reused in empty + chat states)
  const InputBar = ({ compact }: { compact?: boolean }) => (
    <div className={compact ? "max-w-2xl mx-auto w-full" : "max-w-xl mx-auto w-full"}>
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-xs text-foreground">
              {f.type === "image" ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span className="truncate max-w-[100px]">{f.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <AnimatePresence>
          {mentionOpen && (
            <MentionDropdown
              query={mentionQuery}
              onSelect={(agent: AgentDef) => {
                const cursorPos = textareaRef.current?.selectionStart || input.length;
                const before = input.slice(0, cursorPos).replace(/@\w*$/, "");
                const after = input.slice(cursorPos);
                setInput(before + after);
                setActiveAgent(agent.id);
                setMentionOpen(false);
                setMentionQuery("");
              }}
              onClose={() => setMentionOpen(false)}
              visible={mentionOpen}
              categories={["files"]}
            />
          )}
        </AnimatePresence>
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 backdrop-blur-sm px-4 py-3">
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-5 h-5" /></button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full mb-2 left-0 z-40 w-48 bg-black/80 backdrop-blur-2xl border border-border/30 rounded-xl shadow-lg p-1">
                  <button onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-white/5"><Paperclip className="w-4 h-4" /> Attach file</button>
                  <button onClick={() => { setMenuOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-white/5"><Image className="w-4 h-4" /> Attach image</button>
                  <button onClick={() => { setMenuOpen(false); setSearchEnabled(!searchEnabled); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-white/5">
                    <Globe className={`w-4 h-4 ${searchEnabled ? "text-primary" : ""}`} /> {searchEnabled ? "Web search ON" : "Web search"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeAgent && (
                <AgentBadge agentId={activeAgent} onRemove={() => setActiveAgent(null)} size="sm" />
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => {
                  const val = e.target.value;
                  setInput(val);
                  const cursorPos = e.target.selectionStart;
                  const before = val.slice(0, cursorPos);
                  const atMatch = before.match(/@(\w*)$/);
                  if (atMatch) { setMentionOpen(true); setMentionQuery(atMatch[1]); }
                  else { setMentionOpen(false); setMentionQuery(""); }
                }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!mentionOpen) handleGenerate(); } }}
                placeholder={displayedPlaceholder || "Describe what you need..."}
                rows={compact ? 1 : 2}
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1 max-h-32"
                style={{ minHeight: compact ? "32px" : "48px" }}
              />
            </div>
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout onSelectConversation={loadOldConversation} onNewChat={() => { setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]); setConversationId(null); setActiveAgent(null); setPendingQuestions([]); }} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background overflow-x-hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]); setConversationId(null); setActiveAgent(null); setPendingQuestions([]); }} onSelectConversation={loadOldConversation} activeConversationId={conversationId} currentMode="files" />

        {/* Enhanced Preview Modal */}
        <AnimatePresence>
          {previewHtml && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-secondary/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
                  <p className="text-sm font-medium text-foreground">
                    {activeAgent === "slides" ? "Presentation" : "Document"} Preview
                  </p>
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
                <div className={`${previewFullscreen ? "w-full h-full" : "max-w-5xl mx-auto h-full rounded-xl overflow-hidden border border-border/20 shadow-2xl"}`}>
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
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl w-full">
                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-[1.1] tracking-tight text-foreground">CREATE YOUR</h1>
                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-[1] tracking-tight bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">DOCUMENTS</h1>
                <p className="text-sm text-muted-foreground mt-3 mb-8">Generate documents, presentations, spreadsheets and more</p>

                <div className="mb-8">
                  <InputBar />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {FILE_SERVICES.map((svc, i) => (
                    <motion.button
                      key={svc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      onClick={() => { setActiveAgent(svc.id); setInput(svc.prompt + " "); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm ${
                        activeAgent === svc.id
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/60 border-border/30 hover:border-primary/30 hover:bg-secondary text-foreground/80"
                      }`}
                    >
                      <svc.icon className="w-4 h-4" />
                      <span className="font-medium">{svc.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 px-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="prose-chat text-foreground text-sm mb-3">
                        <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "")}</ReactMarkdown>
                      </div>
                      {msg.htmlContent && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setPreviewHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors"><Eye className="w-4 h-4" /> Preview</button>
                          <button onClick={() => handleDownloadHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent transition-colors"><Download className="w-4 h-4" /> HTML</button>
                          <button onClick={() => handleDownloadPdf(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent transition-colors"><Download className="w-4 h-4" /> PDF</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {/* Smart Questions */}
              {pendingQuestions.length > 0 && !isGenerating && (
                <SmartQuestionCard
                  questions={pendingQuestions}
                  onAnswer={(answer) => { setPendingQuestions([]); setInput(answer); setTimeout(() => handleGenerate(answer), 50); }}
                />
              )}
              {isGenerating && <ThinkingLoader />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input - only when in chat mode */}
        {hasMessages && (
          <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <InputBar compact />
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.json,.md" multiple className="hidden" onChange={e => handleFileAttach(e, "file")} />
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileAttach(e, "image")} />
      </div>
    </AppLayout>
  );
};

export default FilesPage;
