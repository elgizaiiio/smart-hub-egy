import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { buildPreviewHtml } from "@/lib/filesHtmlBuilders";
import { Menu, ArrowUp, Plus, X, Download, Eye, FileText } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  htmlContent?: string;
  downloadUrl?: string;
}

interface AttachedFile {
  name: string;
  type: string;
  data: string;
}

interface SavedFile {
  id: string;
  title: string;
  created_at: string;
  mode: string;
}

interface SlideTemplate {
  id: string;
  template_id: string;
  image_url: string | null;
}

const FILE_SERVICES = [
  { id: "slides", label: "Slides", gradient: "from-violet-500 to-purple-600" },
  { id: "slides-pro", label: "Slides Pro", gradient: "from-amber-500 to-orange-600" },
  { id: "document", label: "Document", gradient: "from-cyan-500 to-blue-600" },
  { id: "resume", label: "Resume", gradient: "from-emerald-500 to-teal-600" },
  { id: "report", label: "Report", gradient: "from-rose-500 to-pink-600" },
  { id: "spreadsheet", label: "Spreadsheet", gradient: "from-blue-500 to-indigo-600" },
  { id: "letter", label: "Letter", gradient: "from-orange-500 to-amber-600" },
];

async function readSSEStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return result;
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) result += delta;
      } catch {}
    }
  }
  return result;
}

const FilesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [statusText, setStatusText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SlideTemplate | null>(null);
  const [slideTemplates, setSlideTemplates] = useState<SlideTemplate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isGenerating]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("slide_templates").select("*").eq("is_active", true).order("display_order");
      if (data && data.length > 0) setSlideTemplates(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("conversations").select("id, title, created_at, mode").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(10);
      if (data) setSavedFiles(data as SavedFile[]);
    })();
  }, []);

  useEffect(() => {
    setShowTemplates(activeAgent === "slides");
    if (activeAgent !== "slides") setSelectedTemplate(null);
  }, [activeAgent]);

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

  const getOrCreateConversation = async (firstMsg: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("conversations").insert({ title: firstMsg.slice(0, 50) || "File Generation", mode: "files", user_id: user.id } as any).select("id").single();
    if (data) { setConversationId(data.id); return data.id; }
    return null;
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (msgs) {
      setMessages(msgs.map(m => {
        const msg: ChatMsg = { role: m.role as "user" | "assistant", content: m.content };
        if (m.role === "assistant" && m.images?.[0]) {
          try { const meta = JSON.parse(m.images[0]); if (meta.htmlContent) msg.htmlContent = meta.htmlContent; if (meta.downloadUrl) msg.downloadUrl = meta.downloadUrl; } catch {}
        }
        return msg;
      }));
    }
  };

  const saveMsg = async (convId: string, role: string, content: string, meta?: { htmlContent?: string; downloadUrl?: string }) => {
    await supabase.from("messages").insert({ conversation_id: convId, role, content, images: meta ? [JSON.stringify(meta)] : null });
  };

  const doResearch = async (topic: string): Promise<string> => {
    setStatusText("Researching topic...");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Research this topic thoroughly for a professional presentation. Provide detailed points, statistics, facts, and key insights. Topic: ${topic}` }],
          model: "moonshotai/kimi-k2.5:nitro",
          mode: "files",
          searchEnabled: true,
        }),
      });
      if (!resp.ok || !resp.body) return "";
      return await readSSEStream(resp.body);
    } catch { return ""; }
  };

  const generateSlides = async (userInput: string, researchContent: string, convId: string | null) => {
    const isPro = activeAgent === "slides-pro";
    setStatusText(isPro ? "Creating Pro slides..." : "Creating slides...");
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.functions.invoke("generate-slides", {
      body: {
        topic: userInput,
        content: researchContent || userInput,
        templateId: selectedTemplate?.template_id || undefined,
        tier: isPro ? "pro" : "normal",
        userId: user?.id,
      },
    });

    if (error) { console.error("generate-slides invoke error:", error); return null; }

    if (data?.success && data?.download_url) {
      setStatusText("Finishing up...");
      let summary = `Your presentation "${userInput}" is ready with ${data.slide_count || 10} professional slides.`;
      try {
        const summaryResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Write a brief, friendly 2-sentence summary telling the user their presentation about "${userInput}" is ready. Mention ${data.slide_count || 10} slides. Be enthusiastic but concise. Don't use emojis.` }],
            model: "moonshotai/kimi-k2.5:nitro",
            mode: "files",
          }),
        });
        if (summaryResp.ok && summaryResp.body) {
          const s = await readSSEStream(summaryResp.body);
          if (s.trim()) summary = s.trim();
        }
      } catch {}

      setMessages(prev => [...prev, { role: "assistant", content: summary, downloadUrl: data.download_url }]);
      if (convId) await saveMsg(convId, "assistant", summary, { downloadUrl: data.download_url });
      return true;
    }
    return null;
  };

  const generateHtmlFile = async (userInput: string, files: AttachedFile[], researchContent: string, convId: string | null) => {
    const prompts: Record<string, string> = {
      slides: "You are a Slides Agent. Generate a premium HTML presentation. DARK theme, 10+ slides with scroll-snap sections, professional typography, compelling visuals. Output ONLY complete HTML.",
      "slides-pro": "You are a Premium Slides Agent. Generate a stunning HTML presentation. DARK theme, 12+ slides, cinematic quality, parallax effects. Output ONLY complete HTML.",
      resume: "Generate a professional HTML resume/CV. Modern design, clean typography. Output ONLY complete HTML.",
      spreadsheet: "Generate an interactive HTML table/spreadsheet. Dark theme. Output ONLY complete HTML.",
      document: "Generate a comprehensive HTML document. Professional formatting, well-structured. Output ONLY complete HTML.",
      report: "Generate a detailed professional report as HTML. Include executive summary, charts placeholder, conclusions. Output ONLY complete HTML.",
      letter: "Generate a formal business letter as HTML. Professional formatting. Output ONLY complete HTML.",
    };

    const agentPrompt = activeAgent && prompts[activeAgent] ? prompts[activeAgent] : "Generate a well-formatted HTML document. Professional design. Output ONLY complete HTML.";
    let prompt = `${agentPrompt}\n\nUser request: ${userInput}`;
    if (researchContent) prompt += `\n\nResearch to incorporate:\n${researchContent.slice(0, 4000)}`;

    if (["slides", "slides-pro", "document", "report"].includes(activeAgent || "")) {
      setStatusText("Finding visuals...");
      try {
        const { data: imgData } = await supabase.functions.invoke("search", { body: { query: `${userInput} high quality photos` } });
        const urls = Array.isArray(imgData?.images) ? imgData.images.slice(0, 6) : [];
        if (urls.length) prompt += `\n\nUse these images:\n${urls.map((u: string, i: number) => `${i + 1}. ${u}`).join("\n")}`;
      } catch {}
    }

    files.filter(f => f.type !== "image").forEach(f => { prompt += `\n\n--- ${f.name} ---\n${f.data}`; });
    prompt += `\n\nIMPORTANT: After the HTML, write a brief friendly summary of what you created. Start it with "---SUMMARY---" on a new line.`;

    const imageFiles = files.filter(f => f.type === "image");
    const userMessage: any = imageFiles.length > 0
      ? { role: "user", content: [{ type: "text", text: prompt }, ...imageFiles.map(img => ({ type: "image_url", image_url: { url: img.data } }))] }
      : { role: "user", content: prompt };

    setStatusText("Generating...");
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages: [userMessage], model: "moonshotai/kimi-k2.5:nitro", mode: "files" }),
    });

    if (!resp.ok || !resp.body) {
      setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]);
      return;
    }

    let content = await readSSEStream(resp.body);
    let summary = "";
    const summaryMatch = content.match(/---SUMMARY---([\s\S]*?)$/);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
      content = content.replace(/---SUMMARY---[\s\S]*?$/, "").trim();
    }

    const html = buildPreviewHtml({ content, agent: activeAgent, request: userInput });
    const desc = summary || "Your file is ready. Tap Preview to view it.";

    setMessages(prev => [...prev, { role: "assistant", content: desc, htmlContent: html }]);
    if (convId) await saveMsg(convId, "assistant", desc, { htmlContent: html });
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
    setStatusText("Starting...");

    const convId = await getOrCreateConversation(userContent);
    if (convId) await saveMsg(convId, "user", userContent);

    try {
      const isSlides = activeAgent === "slides" || activeAgent === "slides-pro";
      let research = "";
      if (isSlides || activeAgent === "report") {
        research = await doResearch(userInput);
      }

      if (isSlides) {
        const result = await generateSlides(userInput, research, convId);
        if (!result) {
          setStatusText("Generating HTML presentation...");
          await generateHtmlFile(userInput, files, research, convId);
        }
      } else {
        await generateHtmlFile(userInput, files, research, convId);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("conversations").select("id, title, created_at, mode").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(10);
        if (data) setSavedFiles(data as SavedFile[]);
      }
    } catch (e) {
      console.error("Generation error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }

    setIsGenerating(false);
    setStatusText("");
  }, [input, attachedFiles, activeAgent, conversationId, selectedTemplate]);

  const downloadHtml = (html: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeAgent || "document"}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const printPdf = (html: string) => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Allow popups to export PDF"); return; }
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const newChat = () => {
    setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]);
    setConversationId(null); setActiveAgent(null); setStatusText("");
    setShowTemplates(false); setSelectedTemplate(null);
  };

  const hasMessages = messages.length > 0;

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={newChat} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background overflow-x-hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={newChat} onSelectConversation={loadConversation} activeConversationId={conversationId} currentMode="files" />

        {/* Preview Modal */}
        <AnimatePresence>
          {previewHtml && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 liquid-glass border-b-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm">
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-medium text-foreground">Preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewFullscreen(!previewFullscreen)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs">
                    {previewFullscreen ? "↙" : "↗"}
                  </button>
                  <button onClick={() => downloadHtml(previewHtml)} className="text-xs px-3 py-1.5 rounded-xl liquid-glass-button text-foreground">HTML</button>
                  <button onClick={() => printPdf(previewHtml)} className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">PDF</button>
                </div>
              </div>
              <div className={`flex-1 ${previewFullscreen ? "" : "p-4 md:p-8"}`}>
                <div className={previewFullscreen ? "w-full h-full" : "max-w-5xl mx-auto h-full rounded-xl overflow-hidden liquid-glass-subtle shadow-2xl"}>
                  <iframe srcDoc={previewHtml} className="w-full h-full bg-white" sandbox="allow-scripts" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9" />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4 md:pb-8">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4">
              <div className="flex-1" />

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl w-full">
                {/* Hero text — Landing page style */}
                <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-3">
                  <span className="text-foreground">CREATE</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">ANYTHING</span>
                </h1>
                <p className="text-muted-foreground/50 text-sm mb-10 max-w-xs mx-auto">
                  Slides, documents, resumes, reports — powered by AI
                </p>

                {/* Input area — iOS 26 liquid glass */}
                <div className="max-w-xl mx-auto mb-5">
                  {/* Active badges */}
                  {(activeAgent || selectedTemplate) && (
                    <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
                      {activeAgent && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-subtle text-xs font-medium text-primary">
                          {FILE_SERVICES.find(s => s.id === activeAgent)?.label}
                          <button onClick={() => setActiveAgent(null)} className="ml-0.5 hover:text-foreground"><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {selectedTemplate && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-subtle text-xs font-medium text-violet-400">
                          Template
                          <button onClick={() => setSelectedTemplate(null)} className="ml-0.5 hover:text-foreground"><X className="w-3 h-3" /></button>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attached files */}
                  {attachedFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 px-1 flex-wrap">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-button text-xs text-foreground">
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="liquid-glass rounded-2xl overflow-hidden">
                    <div className="flex items-end gap-2 px-4 py-3 min-h-[100px]">
                      <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors self-end">
                        <Plus className="w-5 h-5" />
                      </button>
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                        placeholder="Describe what you want to create..."
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none min-h-[60px] max-h-[160px] py-1"
                        rows={3}
                      />
                      <button
                        onClick={() => handleGenerate()}
                        disabled={isGenerating || (!input.trim() && attachedFiles.length === 0)}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted-foreground/10 transition-colors self-end disabled:opacity-20"
                      >
                        {isGenerating ? <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Services — pill buttons with glass */}
                <div className="max-w-xl mx-auto mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
                    {FILE_SERVICES.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => setActiveAgent(activeAgent === svc.id ? null : svc.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap shrink-0 transition-all ${
                          activeAgent === svc.id
                            ? `bg-gradient-to-r ${svc.gradient} text-white shadow-lg`
                            : "liquid-glass-button text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        <span className="font-medium">{svc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates */}
                <AnimatePresence>
                  {showTemplates && slideTemplates.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="max-w-xl mx-auto mb-6 overflow-hidden">
                      <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3 text-left px-1">Choose a template</p>
                      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none px-1">
                        {slideTemplates.map(tmpl => (
                          <button
                            key={tmpl.id}
                            onClick={() => setSelectedTemplate(selectedTemplate?.id === tmpl.id ? null : tmpl)}
                            className={`shrink-0 w-36 rounded-xl overflow-hidden transition-all ${
                              selectedTemplate?.id === tmpl.id ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-105" : "liquid-glass-subtle hover:scale-[1.02]"
                            }`}
                          >
                            <div className="aspect-[16/10] bg-secondary/50 flex items-center justify-center">
                              {tmpl.image_url ? (
                                <img src={tmpl.image_url} alt="Template" className="w-full h-full object-cover" loading="lazy"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">{tmpl.template_id.slice(-6)}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Recent files */}
              <div className="flex-1 flex flex-col justify-start pt-6 max-w-xl w-full px-4">
                {savedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">Recent</p>
                    {savedFiles.slice(0, 4).map(f => (
                      <motion.button
                        key={f.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadConversation(f.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl liquid-glass-button text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                        </div>
                        <span className="text-muted-foreground/30 shrink-0 text-xs">→</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Chat area */
            <div className="max-w-2xl mx-auto py-4 px-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[80%] liquid-glass-subtle text-foreground px-4 py-2.5 rounded-[1.6rem] rounded-br-md text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="mb-4 space-y-3">
                      <div className="prose-chat text-foreground text-sm">
                        <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "").replace(/```html[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim()}</ReactMarkdown>
                      </div>
                      {(msg.htmlContent || msg.downloadUrl) && (
                        <div className="flex gap-2 flex-wrap">
                          {msg.htmlContent && (
                            <>
                              <button onClick={() => setPreviewHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-glass-button text-sm font-medium text-foreground hover:text-primary transition-colors">
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                              <button onClick={() => downloadHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-glass-button text-sm text-foreground">
                                <Download className="w-4 h-4" />
                                HTML
                              </button>
                            </>
                          )}
                          {msg.downloadUrl && (
                            <a href={msg.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && <ThinkingLoader searchStatus={statusText || "Working..."} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom input when chatting */}
        {hasMessages && (
          <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-2xl mx-auto">
              <div className="liquid-glass rounded-2xl overflow-hidden">
                <div className="flex items-end gap-2 px-3 py-2">
                  <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors self-end">
                    <Plus className="w-5 h-5" />
                  </button>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                    placeholder="Ask for changes..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none min-h-[24px] max-h-[120px] py-2"
                    rows={1}
                  />
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || (!input.trim() && attachedFiles.length === 0)}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted-foreground/10 transition-colors self-end disabled:opacity-20"
                  >
                    {isGenerating ? <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,image/*" multiple className="hidden" onChange={handleFileAttach} />
      </div>
    </AppLayout>
  );
};

export default FilesPage;
