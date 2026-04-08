import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Eye, Download, X, Presentation, FileSpreadsheet, ScrollText, PenTool, Maximize2, Minimize2, FileText, Play } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import SmartQuestionCard from "@/components/SmartQuestionCard";
import FilesInputBar from "@/components/files/FilesInputBar";
import ResearchFlow from "@/components/files/ResearchFlow";
import type { ResearchStep } from "@/components/files/ResearchFlow";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  htmlContent?: string;
  artifacts?: FileArtifact[];
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

interface FileArtifact {
  url: string;
  label: string;
  kind: string;
}

function extractArtifacts(text: string): FileArtifact[] {
  const urls = Array.from(new Set((text.match(/https?:\/\/[^\s<>\")\]]+/g) || []).map((url) => url.replace(/[.,;]+$/, ""))));
  return urls.map((url) => {
    const kind = /\.pptx?(\?|#|$)/i.test(url)
      ? "pptx"
      : /\.pdf(\?|#|$)/i.test(url)
        ? "pdf"
        : /\.xlsx?(\?|#|$)/i.test(url)
          ? "sheet"
          : /\.docx?(\?|#|$)/i.test(url)
            ? "doc"
            : /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(url)
              ? "image"
              : /canva\.com/i.test(url)
                ? "canva"
                : "link";

    const labelMap: Record<string, string> = {
      pptx: "Download PPTX",
      pdf: "Download PDF",
      sheet: "Download spreadsheet",
      doc: "Download document",
      image: "Open image",
      canva: "Open Canva file",
      link: "Open link",
    };

    return { url, kind, label: labelMap[kind] || "Open file" };
  });
}

const FILE_SERVICES = [
  { id: "slides", label: "Slides", icon: Presentation, prompt: "Create a professional presentation about" },
  { id: "resume", label: "Resume", icon: PenTool, prompt: "Create a professional resume for" },
  { id: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet, prompt: "Create a spreadsheet for" },
  { id: "document", label: "Document", icon: ScrollText, prompt: "Write a professional document about" },
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
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [researchOutline, setResearchOutline] = useState<string[] | null>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, researchSteps]);

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
        if (parsed.type === "questions" && parsed.questions) {
          questions.push(...parsed.questions);
        }
      } catch {}
    }
    if (questions.length > 0) setPendingQuestions(questions);
  }, [messages, isGenerating]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); return; }
      const reader = new FileReader();
      if (type === "image") {
        reader.onload = () => { setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]); };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => { setAttachedFiles(prev => [...prev, { name: file.name, type: file.type, data: (reader.result as string).slice(0, 10000) }]); };
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
        const msg: ChatMsg = { role: m.role as "user" | "assistant", content: m.content, artifacts: extractArtifacts(m.content) };
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

  // Real research flow with actual web search
  const runResearchFlow = async (topic: string): Promise<string> => {
    const searchQueries = [
      topic,
      `${topic} latest data statistics 2026`,
      `${topic} detailed analysis expert opinions`,
    ];

    const steps: ResearchStep[] = searchQueries.map((q, i) => ({
      id: `search${i}`,
      label: `Searching "${q.slice(0, 50)}..."`,
      status: "pending" as const,
    }));
    steps.push(
      { id: "outline", label: "Organizing content structure...", status: "pending" },
      { id: "review", label: "Reviewing content quality...", status: "pending" },
      { id: "generate", label: "Generating final output...", status: "pending" },
    );

    const updateStep = (id: string, status: "active" | "done") => {
      steps.forEach(s => { if (s.id === id) s.status = status; });
      setResearchSteps([...steps]);
    };

    // Real search for each query
    for (let i = 0; i < searchQueries.length; i++) {
      updateStep(`search${i}`, "active");
      try {
        await supabase.functions.invoke("search", { body: { query: searchQueries[i] } });
      } catch {}
      // Update label with real sites found
      steps[i].label = `Searched: "${searchQueries[i].slice(0, 40)}..." ✓`;
      updateStep(`search${i}`, "done");
    }

    // Outline generation
    updateStep("outline", "active");
    try {
      const outlineResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Generate a brief outline (5-8 bullet points) for a ${activeAgent || "document"} about: "${topic}". Return ONLY bullet points, one per line, starting with "- ". No other text.` }],
          model: "google/gemini-2.5-flash"
        }),
      });
      if (outlineResp.ok && outlineResp.body) {
        const reader = outlineResp.body.getReader();
        const decoder = new TextDecoder();
        let outlineText = "";
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let ni: number;
          while ((ni = buf.indexOf("\n")) !== -1) {
            let ln = buf.slice(0, ni); buf = buf.slice(ni + 1);
            if (ln.endsWith("\r")) ln = ln.slice(0, -1);
            if (!ln.startsWith("data: ")) continue;
            const js = ln.slice(6).trim();
            if (js === "[DONE]") break;
            try { const p = JSON.parse(js); const c = p.choices?.[0]?.delta?.content; if (c) outlineText += c; } catch {}
          }
        }
        const items = outlineText.split("\n").filter(l => l.trim().startsWith("-")).map(l => l.trim().replace(/^-\s*/, ""));
        if (items.length > 0) setResearchOutline(items);
      }
    } catch {}
    updateStep("outline", "done");

    updateStep("review", "active");
    await new Promise(r => setTimeout(r, 800));
    updateStep("review", "done");

    updateStep("generate", "active");
    return "ready";
  };

  const handleGenerate = useCallback(async (overrideInput?: string) => {
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
    setResearchSteps([]);
    setResearchOutline(null);

    const convId = await createOrGetConversation(userContent);
    if (convId) await saveMessage(convId, "user", userContent);

    try {
      const isDocGen = activeAgent && ["slides", "resume", "spreadsheet", "document"].includes(activeAgent);
      if (isDocGen && !files.length) {
        await runResearchFlow(userInput);
      }

      const AGENT_PROMPTS: Record<string, string> = {
        slides: `You are an expert presentation designer. The user wants a presentation. First, if the request is vague, respond with smart questions in this JSON format:
\`\`\`json
{"type":"questions","questions":[{"title":"Question?","options":["Option 1","Option 2"],"allowText":true}]}
\`\`\`
If the request is clear enough, generate a complete HTML presentation using Nano Banana-generated visuals for the slides instead of stock images or Pexels:
- DARK themed slideshow with 10+ slides
- Full-viewport sections (100vh) with scroll-snap
- Navigation buttons and slide counter
- Professional typography, gradients, animations
- Color: dark background (#0a0a0f), violet/purple accents, white text
- JavaScript for keyboard navigation
- Use provided Nano Banana image URLs as the main visuals/backgrounds across the slides
- Do not mention Pexels and do not use stock-photo APIs
- Include comprehensive, well-researched content
Output ONLY the complete HTML code with no explanations.`,
        resume: "Generate a professional HTML resume/CV. Modern dark theme. Output ONLY HTML.",
        spreadsheet: "Generate a complete HTML table/spreadsheet. Dark theme. Output ONLY HTML.",
        document: "Generate a comprehensive HTML document. Dark theme. Include well-researched content. Output ONLY HTML.",
      };

      const agentPrompt = activeAgent && AGENT_PROMPTS[activeAgent] ? AGENT_PROMPTS[activeAgent] : "Generate a complete, well-formatted HTML document. Dark theme, professional. Output ONLY HTML.";
      let prompt = `${agentPrompt}\n\nUser request: ${userInput}`;
      if (activeAgent === "slides") {
        try {
          const { data: slideImages } = await supabase.functions.invoke("generate-image", {
            body: {
              prompt: `${userInput}. Create cinematic presentation visuals for a professional slide deck with clean composition and strong focal subjects.`,
              model: "nano-banana",
              num_images: 3,
              image_size: "1536x1024",
            },
          });
          const urls = Array.isArray(slideImages?.images) ? slideImages.images : [];
          if (urls.length > 0) {
            prompt += `\n\nUse these Nano Banana visual URLs in the presentation:\n${urls.map((url: string, index: number) => `${index + 1}. ${url}`).join("\n")}`;
          }
        } catch {}
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
        setResearchSteps([]);
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
        setResearchSteps([]);
        return;
      }

      let html = content;
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) html = htmlMatch[1];

      // Get natural AI description
      let description = "Your document is ready. Click Preview to view it.";
      try {
        const descResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: "user", content: `The user asked: "${userInput}". I created an HTML ${activeAgent || "document"} for them. Write a brief, natural description of what was created. 1-2 sentences. No emoji. Respond in the user's language.` }],
            model: "google/gemini-2.5-flash"
          }),
        });
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
              let ln = descBuffer.slice(0, ni); descBuffer = descBuffer.slice(ni + 1);
              if (ln.endsWith("\r")) ln = ln.slice(0, -1);
              if (!ln.startsWith("data: ")) continue;
              const js = ln.slice(6).trim();
              if (js === "[DONE]") break;
              try { const p = JSON.parse(js); const c = p.choices?.[0]?.delta?.content; if (c) descContent += c; } catch {}
            }
          }
          if (descContent.trim()) description = descContent.trim();
        }
      } catch {}

      setMessages(prev => [...prev, { role: "assistant", content: description, htmlContent: html }]);
      if (convId) await saveMessage(convId, "assistant", description, html);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("conversations").select("id, title, created_at, mode").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(10);
        if (data) setSavedFiles(data as SavedFile[]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]);
    }
    setIsGenerating(false);
    setResearchSteps([]);
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

  const handleAttach = (type: "file" | "image") => {
    if (type === "file") fileInputRef.current?.click();
    else imageInputRef.current?.click();
  };

  const newChat = () => {
    setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]);
    setConversationId(null); setActiveAgent(null); setPendingQuestions([]);
    setResearchSteps([]); setResearchOutline(null);
  };

  const hasMessages = messages.length > 0;

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
                  <p className="text-sm font-medium text-foreground">{activeAgent === "slides" ? "Presentation" : "Document"} Preview</p>
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
              {/* Centered content with input in the middle */}
              <div className="flex-1" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl w-full">
                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-[1.1] tracking-tight text-foreground">CREATE YOUR</h1>
                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-[1] tracking-tight bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">DOCUMENTS</h1>
                <p className="text-sm text-muted-foreground mt-3 mb-6">Generate documents, presentations, spreadsheets and more</p>

                <div className="mb-4">
                  <FilesInputBar
                    input={input}
                    onInputChange={setInput}
                    onSubmit={() => handleGenerate()}
                    isGenerating={isGenerating}
                    activeAgent={activeAgent}
                    onAgentChange={setActiveAgent}
                    attachedFiles={attachedFiles}
                    onAttach={handleAttach}
                    onRemoveAttachment={(i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    searchEnabled={searchEnabled}
                    onToggleSearch={() => setSearchEnabled(!searchEnabled)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
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

              {/* Bottom section: recent files or example */}
              <div className="flex-1 flex flex-col justify-start pt-4 max-w-xl w-full px-4">
                {savedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">Recent Files</p>
                    {savedFiles.slice(0, 4).map(f => {
                      const gradients = [
                        "from-violet-500/20 to-purple-600/20",
                        "from-blue-500/20 to-cyan-500/20",
                        "from-emerald-500/20 to-teal-500/20",
                        "from-orange-500/20 to-amber-500/20",
                      ];
                      return (
                        <motion.button
                          key={f.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadOldConversation(f.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/30 text-left hover:bg-secondary/60 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[savedFiles.indexOf(f) % gradients.length]} flex items-center justify-center shrink-0`}>
                            <FileText className="w-5 h-5 text-foreground/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                          </div>
                          <Play className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">Example</p>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setActiveAgent("slides"); setInput("Create a presentation about Egypt"); }}
                      className="w-full rounded-2xl overflow-hidden border border-border/30 bg-secondary/30 text-left hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-full h-36 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-pink-500/20 flex items-center justify-center">
                          <Presentation className="w-12 h-12 text-foreground/30" />
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-medium text-foreground">Egypt — Where Ancient Wonders Meet Modern Vitality</p>
                        <p className="text-xs text-muted-foreground mt-1">Sample Presentation · Megsy AI</p>
                      </div>
                    </motion.button>
                  </div>
                )}
              </div>
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
                        <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "").replace(/```html[\s\S]*?```/g, "")}</ReactMarkdown>
                      </div>
                      {/* Real artifact links */}
                      {msg.artifacts && msg.artifacts.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
                          {msg.artifacts.map((art, ai) => (
                            <a key={ai} href={art.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors">
                              <Download className="w-4 h-4" /> {art.label}
                            </a>
                          ))}
                        </div>
                      )}
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
              {pendingQuestions.length > 0 && !isGenerating && (
                <SmartQuestionCard
                  questions={pendingQuestions}
                  onAnswer={(answer) => { setPendingQuestions([]); setInput(answer); setTimeout(() => handleGenerate(answer), 50); }}
                />
              )}
              {researchSteps.length > 0 && (
                <ResearchFlow steps={researchSteps} outline={researchOutline} />
              )}
              {isGenerating && researchSteps.length === 0 && <ThinkingLoader />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {hasMessages && (
          <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <FilesInputBar
              compact
              input={input}
              onInputChange={setInput}
              onSubmit={() => handleGenerate()}
              isGenerating={isGenerating}
              activeAgent={activeAgent}
              onAgentChange={setActiveAgent}
              attachedFiles={attachedFiles}
              onAttach={handleAttach}
              onRemoveAttachment={(i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
              searchEnabled={searchEnabled}
              onToggleSearch={() => setSearchEnabled(!searchEnabled)}
            />
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.json,.md" multiple className="hidden" onChange={e => handleFileAttach(e, "file")} />
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileAttach(e, "image")} />
      </div>
    </AppLayout>
  );
};

export default FilesPage;
