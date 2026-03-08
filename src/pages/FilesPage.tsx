import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Loader2, Eye, Download, X, Globe, Image, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import FancyButton from "@/components/FancyButton";
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
  "Convert image to PDF",
  "Create a spreadsheet",
  "Generate a PDF",
];

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M7.71 3.5L1.15 15l3.44 5.96L11.15 9.46 7.71 3.5z" fill="#0066DA"/>
    <path d="M16.29 3.5H7.71l6.56 11.46h8.58L16.29 3.5z" fill="#00AC47"/>
    <path d="M1.15 15l3.44 5.96h14.82l3.44-5.96H1.15z" fill="#EA4335"/>
  </svg>
);
const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.16c-.42-.326-.98-.7-2.055-.607L3.572 2.573c-.467.047-.56.28-.374.466l1.261 1.17zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933z"/>
  </svg>
);

const FILE_INTEGRATIONS = [
  { name: "Google Drive", icon: GoogleDriveIcon, desc: "Upload & access files" },
  { name: "Notion", icon: NotionIcon, desc: "Create & import pages" },
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (input) return;
    const target = FILE_PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (i < target.length) { setDisplayedPlaceholder(target.slice(0, i + 1)); i++; }
      else { clearInterval(t); setTimeout(() => setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length), 2500); }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx, input]);

  // Close menu on outside click
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
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles(prev => [...prev, { name: file.name, type: file.type, data: reader.result as string }]);
        toast.success(`${file.name} attached`);
      };
      reader.readAsDataURL(file);
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
      setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    await supabase.from("messages").insert({ conversation_id: convId, role, content });
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
      if (files.length > 0) prompt += `\n\n[User attached ${files.length} file(s): ${files.map(f => f.name).join(", ")}]`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "google/gemini-3-flash-preview", mode: "files" }),
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

      const descResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `The user asked: "${userInput}". I created an HTML document for them. Write a brief, friendly description of what was created and suggest 2-3 improvements. Keep it conversational, 2-3 sentences max. Do not use emoji. Respond in the same language as the user's request.` }],
          model: "google/gemini-3-flash-preview",
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
      if (convId) await saveMessage(convId, "assistant", description);
    } catch {
      const failMsg = "Generation failed. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: failMsg }]);
      if (convId) await saveMessage(convId, "assistant", failMsg);
    }
    setIsGenerating(false);
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
    <div className="h-full flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]); setConversationId(null); }} onSelectConversation={loadOldConversation} activeConversationId={conversationId} currentMode="files" />

      {/* Preview Modal */}
      <AnimatePresence>
        {previewHtml && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Preview</p>
              <div className="flex gap-2">
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

      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
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

      <div className="sticky bottom-0 z-20 shrink-0 px-3 pt-1 pb-4 bg-background" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <div className="max-w-3xl mx-auto relative">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground">
                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-primary/30 bg-transparent backdrop-blur-md px-3 py-2">
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Plus className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-64 rounded-2xl"
                  >
                    {/* TOOLS */}
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-0.5">Tools</p>
                    <button
                      onClick={() => { setSearchEnabled(!searchEnabled); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-accent/60 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                        <Globe className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] text-foreground font-medium">Web Search</p>
                        <p className="text-[10px] text-muted-foreground">Search the web</p>
                      </div>
                      <div className={`w-8 h-[18px] rounded-full transition-colors flex items-center ${searchEnabled ? "bg-primary justify-end" : "bg-border justify-start"}`}>
                        <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
                      </div>
                    </button>

                    {/* ATTACH */}
                    <div className="border-t border-border pt-1.5 mt-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-0.5">Attach</p>
                      <button onClick={() => { imageInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left hover:bg-accent/60 transition-all group">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <Image className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-foreground font-medium">Image</p>
                        </div>
                      </button>
                      <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left hover:bg-accent/60 transition-all group">
                        <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                          <Paperclip className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-foreground font-medium">Document</p>
                        </div>
                      </button>
                    </div>

                    {/* INTEGRATIONS - PREMIUM */}
                    <div className="border-t border-border pt-1.5 mt-1.5">
                      <div className="flex items-center justify-between px-1 mb-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Integrations</p>
                        <span className="text-[7px] px-1.5 py-[2px] rounded-full bg-gradient-to-r from-amber-400/15 to-amber-600/15 text-amber-400 border border-amber-400/20 font-semibold tracking-widest uppercase">Premium</span>
                      </div>

                      {FILE_INTEGRATIONS.map((app) => {
                        const IconComp = app.icon;
                        return (
                          <button
                            key={app.name}
                            onClick={() => { navigate("/settings/integrations"); setMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left hover:bg-accent/60 transition-all group"
                          >
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                              <IconComp />
                            </div>
                            <div className="flex-1">
                              <p className="text-[13px] text-foreground font-medium">{app.name}</p>
                            </div>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => { navigate("/settings/integrations"); setMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl hover:bg-accent/60 transition-all text-[11px] text-muted-foreground font-medium"
                      >
                        Show more
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={() => { /* Enter creates new line naturally */ }}
              placeholder={displayedPlaceholder + "│"}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
              style={{ minHeight: "32px" }}
            />
            <button onClick={handleGenerate} disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating} className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-20 ${isGenerating ? "bg-[#7C3AED] text-white animate-pulse-slow" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx" multiple onChange={(e) => handleFileAttach(e, "file")} />
          <input ref={imageInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileAttach(e, "image")} />
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default FilesPage;
