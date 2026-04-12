import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { buildPreviewHtml } from "@/lib/filesHtmlBuilders";

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
  { id: "slides", label: "Slides", color: "hsl(var(--primary))" },
  { id: "slides-pro", label: "Slides Pro", color: "hsl(38 92% 50%)" },
  { id: "document", label: "Document", color: "hsl(190 80% 50%)" },
  { id: "resume", label: "Resume", color: "hsl(160 60% 45%)" },
  { id: "report", label: "Report", color: "hsl(350 80% 55%)" },
  { id: "spreadsheet", label: "Spreadsheet", color: "hsl(220 70% 55%)" },
  { id: "letter", label: "Letter", color: "hsl(30 80% 55%)" },
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

  // Load slide templates from DB
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
    setStatusText(isPro ? "Creating Pro slides (this may take a few minutes)..." : "Creating slides...");
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
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-secondary/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm">✕</button>
                  <p className="text-sm font-medium text-foreground">Preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewFullscreen(!previewFullscreen)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs">
                    {previewFullscreen ? "↙" : "↗"}
                  </button>
                  <button onClick={() => downloadHtml(previewHtml)} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors">HTML</button>
                  <button onClick={() => printPdf(previewHtml)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">PDF</button>
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

        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg">☰</button>
          <div className="w-9" />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4 md:pb-8">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4">
              <div className="flex-1" />

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl w-full">
                {/* Hero - matching CodeWorkspace style */}
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-2">
                  <span className="bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Create</span>
                  {" "}
                  <span className="text-foreground">anything.</span>
                </h1>
                <p className="text-muted-foreground/60 text-sm mb-8 max-w-sm mx-auto">
                  Slides, documents, resumes, reports — powered by AI
                </p>

                {/* Input area - clean rectangular design */}
                <div className="max-w-xl mx-auto mb-4">
                  {/* Active badges */}
                  {(activeAgent || selectedTemplate) && (
                    <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
                      {activeAgent && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                          {FILE_SERVICES.find(s => s.id === activeAgent)?.label}
                          <button onClick={() => setActiveAgent(null)} className="ml-1 hover:text-foreground">✕</button>
                        </div>
                      )}
                      {selectedTemplate && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                          Template
                          <button onClick={() => setSelectedTemplate(null)} className="ml-1 hover:text-foreground">✕</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attached files */}
                  {attachedFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 px-1 flex-wrap">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30 text-xs text-foreground">
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2 rounded-2xl border border-border/40 bg-secondary/30 backdrop-blur-sm px-4 py-3 min-h-[100px]">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 self-end text-lg">+</button>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                      placeholder="Describe what you want to create..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[60px] max-h-[160px] py-1"
                      rows={3}
                    />
                    <button
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || (!input.trim() && attachedFiles.length === 0)}
                      className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-all shrink-0 self-end hover:bg-primary/90 text-sm font-bold"
                    >
                      {isGenerating ? "..." : "→"}
                    </button>
                  </div>
                </div>

                {/* Services row - single horizontal scroll, no icons */}
                <div className="max-w-xl mx-auto mb-5">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
                    {FILE_SERVICES.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => setActiveAgent(activeAgent === svc.id ? null : svc.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm whitespace-nowrap shrink-0 ${
                          activeAgent === svc.id ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/40 border-border/30 hover:border-primary/20 text-foreground/80"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: svc.color }} />
                        <span className="font-medium">{svc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates from DB */}
                <AnimatePresence>
                  {showTemplates && slideTemplates.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="max-w-xl mx-auto mb-6 overflow-hidden">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 text-left px-1">Choose a template</p>
                      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none px-1">
                        {slideTemplates.map(tmpl => (
                          <button
                            key={tmpl.id}
                            onClick={() => setSelectedTemplate(selectedTemplate?.id === tmpl.id ? null : tmpl)}
                            className={`shrink-0 w-36 rounded-xl border-2 overflow-hidden transition-all ${
                              selectedTemplate?.id === tmpl.id ? "border-primary shadow-lg shadow-primary/20 scale-105" : "border-border/30 hover:border-border/60"
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
              <div className="flex-1 flex flex-col justify-start pt-4 max-w-xl w-full px-4">
                {savedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">Recent</p>
                    {savedFiles.slice(0, 4).map(f => (
                      <motion.button
                        key={f.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadConversation(f.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/20 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">F</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                        </div>
                        <span className="text-muted-foreground/40 shrink-0 text-xs">→</span>
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
                            Preview
                          </button>
                          <button onClick={() => downloadHtml(msg.htmlContent!)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border/30 text-foreground text-sm hover:bg-accent transition-colors">
                            Download
                          </button>
                        </div>
                      )}
                      {msg.downloadUrl && (
                        <a href={msg.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                          Download Presentation
                        </a>
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
              <div className="flex items-end gap-2 rounded-2xl border border-border/40 bg-secondary/30 backdrop-blur-sm px-3 py-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 self-end text-lg">+</button>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  placeholder="Ask for changes..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[24px] max-h-[120px] py-1"
                  rows={1}
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || (!input.trim() && attachedFiles.length === 0)}
                  className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-all shrink-0 self-end hover:bg-primary/90 text-sm font-bold"
                >
                  {isGenerating ? "..." : "→"}
                </button>
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
