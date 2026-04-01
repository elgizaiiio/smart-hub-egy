import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Loader2, Eye, Download, X, Globe, Image, FileText } from "lucide-react";
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

const SUGGESTIONS = [
  "Write a professional report",
  "Create a presentation",
  "Summarize this document",
];

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M7.71 3.5L1.15 15l3.44 5.96L11.15 9.46 7.71 3.5z" fill="#0066DA"/>
    <path d="M16.29 3.5H7.71l6.56 11.46h8.58L16.29 3.5z" fill="#00AC47"/>
    <path d="M1.15 15l3.44 5.96h14.82l3.44-5.96H1.15z" fill="#EA4335"/>
  </svg>
);

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
    if (input) { setDisplayedPlaceholder(""); }
    else if (!input) { setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length); }
  }, [input]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "32px";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [input]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      if (type === "image") {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
          toast.success(`${file.name} attached`);
        };
        reader.readAsDataURL(file);
      } else {
        // Read text content for documents
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          setAttachedFiles(prev => [...prev, { name: file.name, type: file.type, data: text.slice(0, 10000) }]);
          toast.success(`${file.name} attached`);
        };
        reader.readAsText(file);
      }
    });
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
        // Restore htmlContent from images field (we store it there as JSON)
        if (m.role === "assistant" && m.images && m.images.length > 0) {
          try {
            const meta = JSON.parse(m.images[0]);
            if (meta.htmlContent) msg.htmlContent = meta.htmlContent;
          } catch {
            // Not JSON, ignore
          }
        }
        loaded.push(msg);
      }
      setMessages(loaded);
    }
  };

  const saveMessage = async (convId: string, role: string, content: string, htmlContent?: string) => {
    // Store htmlContent in the images field as JSON for persistence
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
      // Build the prompt with actual file/image content
      let prompt = `Generate a complete, well-formatted, comprehensive and detailed HTML document for the following request. Include proper styling with CSS, make it look professional and polished. Output ONLY the HTML code, no explanations:\n\n${userInput}`;
      
      // Include actual file content
      const fileAttachments = files.filter(f => f.type !== "image");
      if (fileAttachments.length > 0) {
        prompt += "\n\n--- Attached Documents ---\n";
        fileAttachments.forEach(f => {
          prompt += `\n--- ${f.name} ---\n${f.data}\n`;
        });
      }

      // Build messages with history for memory
      const historyMessages = messages.map(m => ({
        role: m.role,
        content: m.role === "assistant" ? m.content : m.content,
      }));

      // For images, send as multimodal
      const imageAttachments = files.filter(f => f.type === "image");
      let userMessage: any;
      if (imageAttachments.length > 0) {
        const content: any[] = imageAttachments.map(img => ({
          type: "image_url",
          image_url: { url: img.data },
        }));
        content.push({ type: "text", text: prompt });
        userMessage = { role: "user", content };
      } else {
        userMessage = { role: "user", content: prompt };
      }

      const allMessages = [...historyMessages, userMessage];

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, model: "gemini-3.1-flash-lite-preview", mode: "files", searchEnabled }),
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
          try { const parsed = JSON.parse(jsonStr); const delta = parsed.choices?.[0]?.delta?.content; if (delta) content += delta; } catch { /* skip */ }
        }
      }

      let html = content;
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) html = htmlMatch[1];

      // Generate a contextual description
      const descResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `The user asked: "${userInput}". I created an HTML document for them. Write a unique, contextual description of what was created. Be specific about the content. Suggest 2-3 specific improvements based on what was actually generated. Keep it conversational, 2-4 sentences. Do not use emoji. Respond in the same language as the user's request. IMPORTANT: Do not repeat the same description every time - be creative and specific.` }],
          model: "gemini-3.1-flash-lite-preview",
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
    a.href = url;
    a.download = "document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  };

  const handleDownloadPdf = (html: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups"); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
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
                <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
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

      <div className="flex-1 overflow-y-auto min-h-0 pb-44 md:pb-52">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Create anything with files</h2>
              <p className="text-sm text-muted-foreground mb-6">Generate documents, analyze files, create presentations and more</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setInput(s)}
                    className="px-5 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border"
                  >
                    {s}
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
                    <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="prose-chat text-foreground text-sm mb-3">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.htmlContent && (
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent transition-colors">
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                        <button onClick={() => handleDownloadHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent transition-colors">
                          <Download className="w-4 h-4" /> HTML
                        </button>
                        <button onClick={() => handleDownloadPdf(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                          <Download className="w-4 h-4" /> PDF
                        </button>
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

      <div className="fixed inset-x-0 bottom-0 z-30 shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
        <div className="max-w-3xl mx-auto relative pointer-events-auto">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground border border-border/40">
                  {f.type === "image" ? (
                    <img src={f.data} alt="" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Paperclip className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-[2rem] border border-primary/25 bg-background/20 backdrop-blur-xl px-4 py-3 shadow-[0_20px_80px_hsl(var(--foreground)/0.08)]">
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-0 bg-transparent shadow-none text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-60">
                    {/* Toggle: Web Search */}
                    <button
                      onClick={() => { setSearchEnabled(!searchEnabled); setMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Web search</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${searchEnabled ? "bg-primary justify-end" : "bg-border justify-start"}`}>
                        <div className="w-4 h-4 rounded-full bg-white mx-0.5" />
                      </div>
                    </button>

                    <div className="border-t border-border my-1.5" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1">Attach</p>

                    <button onClick={() => { imageInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                      <Image className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Image</span>
                    </button>
                    <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Document</span>
                    </button>

                    <div className="border-t border-border my-1.5" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1">Integrations</p>

                    <button
                      onClick={() => { navigate("/settings/integrations"); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                    >
                      <GoogleDriveIcon />
                      <div className="min-w-0">
                        <span className="text-sm text-foreground block">Google Drive</span>
                        <span className="text-[10px] text-muted-foreground">Upload & access files</span>
                      </div>
                    </button>
                    <button
                      onClick={() => { navigate("/settings/integrations"); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <span className="text-sm text-foreground block">Notion</span>
                        <span className="text-[10px] text-muted-foreground">Sync docs and notes</span>
                      </div>
                    </button>
                    <button
                      onClick={() => { navigate("/settings/integrations"); setMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-xs text-muted-foreground"
                    >
                      Show more
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={displayedPlaceholder + "│"}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2.5 max-h-36"
              style={{ minHeight: "42px" }}
            />
            <button onClick={handleGenerate} disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating} className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-20 ${isGenerating ? "bg-[#7C3AED] text-white animate-pulse-slow" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx,.xml,.html,.css" multiple onChange={(e) => handleFileAttach(e, "file")} />
          <input ref={imageInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileAttach(e, "image")} />
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default FilesPage;
