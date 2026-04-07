import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Loader2, Eye, Download, X, Globe, Image, FileText, Presentation, FileSpreadsheet, ScrollText, PenTool } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";

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

const FILE_SERVICES = [
  { id: "slides", label: "Slides", icon: Presentation, gradient: "from-violet-500/20 to-purple-500/20", prompt: "Create a professional presentation about" },
  { id: "resume", label: "Resume", icon: PenTool, gradient: "from-blue-500/20 to-cyan-500/20", prompt: "Create a professional resume for" },
  { id: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet, gradient: "from-emerald-500/20 to-green-500/20", prompt: "Create a spreadsheet for" },
  { id: "document", label: "Document", icon: ScrollText, gradient: "from-amber-500/20 to-orange-500/20", prompt: "Write a professional document about" },
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
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
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

  const handleGenerate = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    const userContent = input || `[Attached ${attachedFiles.length} file(s)]`;
    const userMsg: ChatMsg = { role: "user", content: userContent };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    const files = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);

    const convId = await createOrGetConversation(userContent);
    if (convId) await saveMessage(convId, "user", userContent);

    try {
      let prompt = `Generate a complete, well-formatted, comprehensive and detailed HTML document for the following request. Include proper styling with CSS, make it look professional and polished. Output ONLY the HTML code, no explanations:\n\n${userInput}`;
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

      const descResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: "user", content: `The user asked: "${userInput}". I created an HTML document for them. Write a unique, contextual description of what was created. Be specific. Suggest 2-3 improvements. Keep it conversational, 2-4 sentences. No emoji. Respond in the user's language.` }], model: "claude-haiku-4-5" }),
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
    a.href = url; a.download = "document.html";
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

  return (
    <AppLayout onSelectConversation={loadOldConversation} onNewChat={() => { setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]); setConversationId(null); }} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background overflow-x-hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]); setConversationId(null); }} onSelectConversation={loadOldConversation} activeConversationId={conversationId} currentMode="files" />

        {/* Preview Modal */}
        <AnimatePresence>
          {previewHtml && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">Preview</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDownloadHtml(previewHtml)} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent">HTML</button>
                  <button onClick={() => handleDownloadPdf(previewHtml)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">PDF</button>
                  <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <iframe srcDoc={previewHtml} className="flex-1 w-full bg-white" sandbox="allow-scripts" />
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
                {/* Hero text */}
                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-[1.1] tracking-tight text-foreground">CREATE YOUR</h1>
                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-[1] tracking-tight bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">DOCUMENTS</h1>
                <p className="text-sm text-muted-foreground mt-3 mb-8">Generate documents, presentations, spreadsheets and more</p>

                {/* Centered Input - bigger */}
                <div className="max-w-xl mx-auto mb-10">
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
                  <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-4 py-3">
                    <div className="relative" ref={menuRef}>
                      <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-5 h-5" /></button>
                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full mb-2 left-0 z-40 w-48 bg-card border border-border rounded-xl shadow-lg p-1">
                            <button onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent"><Paperclip className="w-4 h-4" /> Attach file</button>
                            <button onClick={() => { setMenuOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent"><Image className="w-4 h-4" /> Attach image</button>
                            <button onClick={() => { setMenuOpen(false); setSearchEnabled(!searchEnabled); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent">
                              <Globe className={`w-4 h-4 ${searchEnabled ? "text-primary" : ""}`} /> {searchEnabled ? "Web search ON" : "Web search"}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                        placeholder={displayedPlaceholder || "Describe what you need..."}
                        rows={2}
                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1 max-h-32"
                        style={{ minHeight: "48px" }}
                      />
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Service cards - clean horizontal pills */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {FILE_SERVICES.map((svc, i) => (
                    <motion.button
                      key={svc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      onClick={() => setInput(svc.prompt + " ")}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 border border-border/30 hover:border-primary/30 hover:bg-secondary transition-all text-sm"
                    >
                      <svc.icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground/80">{svc.label}</span>
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
                      <div className="prose-chat text-foreground text-sm mb-3"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      {msg.htmlContent && (
                        <div className="flex gap-2">
                          <button onClick={() => setPreviewHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent transition-colors"><Eye className="w-4 h-4" /> Preview</button>
                          <button onClick={() => handleDownloadHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent transition-colors"><Download className="w-4 h-4" /> HTML</button>
                          <button onClick={() => handleDownloadPdf(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"><Download className="w-4 h-4" /> PDF</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && <ThinkingLoader />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input - only when in chat mode */}
        {hasMessages && (
          <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-2xl mx-auto">
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
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-5 h-5" /></button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full mb-2 left-0 z-40 w-48 bg-card border border-border rounded-xl shadow-lg p-1">
                        <button onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent"><Paperclip className="w-4 h-4" /> Attach file</button>
                        <button onClick={() => { setMenuOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent"><Image className="w-4 h-4" /> Attach image</button>
                        <button onClick={() => { setMenuOpen(false); setSearchEnabled(!searchEnabled); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent">
                          <Globe className={`w-4 h-4 ${searchEnabled ? "text-primary" : ""}`} /> {searchEnabled ? "Web search ON" : "Web search"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                    placeholder={displayedPlaceholder || "Describe what you need..."}
                    rows={1}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
                    style={{ minHeight: "32px" }}
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.json,.md" multiple className="hidden" onChange={e => handleFileAttach(e, "file")} />
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileAttach(e, "image")} />
      </div>
    </AppLayout>
  );
};

export default FilesPage;
