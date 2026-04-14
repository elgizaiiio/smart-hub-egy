import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import ResearchFlow, { ResearchStep } from "@/components/files/ResearchFlow";
import FilePreviewPanel from "@/components/files/FilePreviewPanel";
import ExportDialog from "@/components/files/ExportDialog";
import { buildPreviewHtml } from "@/lib/filesHtmlBuilders";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, ArrowUp, Plus, X, Download, Eye, FileText, Undo2, Redo2 } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  htmlContent?: string;
  downloadUrl?: string;
  isQuestion?: boolean;
  questionOptions?: string[];
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
  { id: "slides", label: "Slides" },
  { id: "document", label: "Document" },
  { id: "resume", label: "Resume" },
  { id: "report", label: "Report" },
  { id: "spreadsheet", label: "Spreadsheet" },
  { id: "letter", label: "Letter" },
  { id: "roadmap", label: "Roadmap" },
  { id: "mindmap", label: "Mindmap" },
  { id: "timeline", label: "Timeline" },
];

const SPREADSHEET_TEMPLATES = [
  { label: "Financial Report", prompt: "Create a comprehensive financial report spreadsheet with revenue, expenses, net income, assets, liabilities, and key financial ratios" },
  { label: "Employee Directory", prompt: "Create an employee directory spreadsheet with columns for name, department, position, email, phone, hire date, and status" },
  { label: "Sales Tracker", prompt: "Create a sales tracking spreadsheet with columns for date, product, quantity, unit price, total, salesperson, and region" },
  { label: "Project Budget", prompt: "Create a project budget spreadsheet with categories, planned budget, actual spending, variance, and completion status" },
  { label: "Data Analysis", prompt: "Create a data analysis spreadsheet with sample dataset, summary statistics, pivot table, and trend analysis" },
];

async function readSSEStreamWithStatus(
  body: ReadableStream<Uint8Array>,
  onStatus?: (status: string) => void,
  onContent?: (chunk: string) => void
): Promise<string> {
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
        if (delta) {
          // Parse [STATUS: ...] markers
          const statusMatch = delta.match(/\[STATUS:\s*(.*?)\]/);
          if (statusMatch && onStatus) {
            onStatus(statusMatch[1]);
          }
          // Remove status markers from visible content
          const cleanDelta = delta.replace(/\[STATUS:\s*.*?\]/g, "");
          if (cleanDelta) {
            result += cleanDelta;
            onContent?.(cleanDelta);
          }
        }
      } catch {}
    }
  }
  return result;
}

const FilesPage = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [statusText, setStatusText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SlideTemplate | null>(null);
  const [slideTemplates, setSlideTemplates] = useState<SlideTemplate[]>([]);
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [exportHtml, setExportHtml] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [undoStack, setUndoStack] = useState<ChatMsg[][]>([]);
  const [redoStack, setRedoStack] = useState<ChatMsg[][]>([]);
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
      const { data } = await supabase.from("conversations").select("id, title, created_at, mode").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(20);
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

  // Auto-save
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.htmlContent) {
      setPreviewHtml(lastMsg.htmlContent);
      if (!isMobile) setActiveTab("preview");
    }
  }, [messages, conversationId, isMobile]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10MB)`); return; }
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
      const loaded = msgs.map(m => {
        const msg: ChatMsg = { role: m.role as "user" | "assistant", content: m.content };
        if (m.role === "assistant" && m.images?.[0]) {
          try { const meta = JSON.parse(m.images[0]); if (meta.htmlContent) msg.htmlContent = meta.htmlContent; if (meta.downloadUrl) msg.downloadUrl = meta.downloadUrl; } catch {}
        }
        return msg;
      });
      setMessages(loaded);
      // Show last preview
      const lastHtml = [...loaded].reverse().find(m => m.htmlContent);
      if (lastHtml?.htmlContent) {
        setPreviewHtml(lastHtml.htmlContent);
        if (!isMobile) setActiveTab("preview");
      }
    }
  };

  const saveMsg = async (convId: string, role: string, content: string, meta?: { htmlContent?: string; downloadUrl?: string }) => {
    await supabase.from("messages").insert({ conversation_id: convId, role, content, images: meta ? [JSON.stringify(meta)] : null });
  };

  const addResearchStep = (label: string) => {
    setResearchSteps(prev => {
      const updated = prev.map(s => ({ ...s, status: "done" as const }));
      return [...updated, { id: `step-${Date.now()}`, label, status: "active" as const }];
    });
  };

  const doResearchWithStreaming = async (topic: string): Promise<string> => {
    setResearchSteps([{ id: "start", label: "Starting research...", status: "active" }]);

    const systemPrompt = `You are a deep research agent. Research the following topic thoroughly and provide comprehensive, detailed information.
IMPORTANT: As you research, output [STATUS: description] markers to show your progress. Examples:
[STATUS: Searching for historical information about the topic...]
[STATUS: Found key data about ancient civilizations...]
[STATUS: Gathering statistics and modern research...]
[STATUS: Compiling comprehensive analysis...]

After all status updates, provide your full research findings in detail. Include facts, statistics, dates, names, and verified information.
Write at least 2000 words of research content. Be thorough and accurate.
Do NOT invent information. Only provide verified facts.`;

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Research this topic deeply and provide comprehensive information: ${topic}` }
          ],
          model: "moonshotai/kimi-k2.5:nitro",
          mode: "files",
          searchEnabled: true,
        }),
      });
      if (!resp.ok || !resp.body) return "";
      return await readSSEStreamWithStatus(resp.body, (status) => {
        addResearchStep(status);
      });
    } catch { return ""; }
  };

  const generateSlides = async (userInput: string, researchContent: string, convId: string | null) => {
    addResearchStep("Creating your presentation...");
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.functions.invoke("generate-slides", {
      body: { topic: userInput, content: researchContent || userInput, templateId: selectedTemplate?.template_id || undefined, tier: "normal", userId: user?.id },
    });
    if (error || !data?.success) return null;

    if (data?.download_url) {
      addResearchStep("Preparing summary...");
      let summary = `Your presentation "${userInput}" is ready with ${data.slide_count || 10} professional slides.`;
      try {
        const summaryResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Write a brief, personalized 2-3 sentence summary. You just created a presentation about "${userInput}" with ${data.slide_count || 10} slides. Describe what sections you covered and mention the preview button. Respond in the same language as the topic. Don't use emojis.` }],
            model: "moonshotai/kimi-k2.5:nitro", mode: "files",
          }),
        });
        if (summaryResp.ok && summaryResp.body) {
          const s = await readSSEStreamWithStatus(summaryResp.body);
          if (s.trim()) summary = s.trim();
        }
      } catch {}

      pushMessage({ role: "assistant", content: summary, downloadUrl: data.download_url });
      if (convId) await saveMsg(convId, "assistant", summary, { downloadUrl: data.download_url });
      return true;
    }
    return null;
  };

  const generateHtmlFile = async (userInput: string, files: AttachedFile[], researchContent: string, convId: string | null) => {
    addResearchStep("Generating your file...");

    const agentType = activeAgent || "document";
    const imageFiles = files.filter(f => f.type === "image");
    const textFiles = files.filter(f => f.type !== "image");

    const systemPrompt = `You are an intelligent file generation agent called Megsy.
You have TWO modes:
1. CHAT MODE: If the user asks a question, wants advice, or has a conversation — respond naturally. Do NOT generate any file.
2. GENERATE MODE: If the user wants a file (document, report, slides, spreadsheet, resume, letter, roadmap, mindmap, timeline) — generate it.

Current file type: ${agentType}

CRITICAL RULES FOR FILE GENERATION:
- This is a FILE, NOT a website. Do NOT include navigation bars, fixed headers, buttons, or interactive UI elements.
- Generate LARGE, comprehensive content. Minimum 2000 words for reports/documents.
- Do NOT invent information. Use ONLY the research data provided and the user's explicit instructions.
- Do NOT add placeholder images, random tables, or filler content unless specifically requested.
- Do NOT abbreviate, summarize, or truncate the user's request.
- If the user attached images, analyze them carefully and incorporate the visual content into your response.
- Output ONLY complete, valid HTML for file content.
- Respond in the SAME LANGUAGE as the user's message.

${agentType === "spreadsheet" ? `
SPREADSHEET RULES:
- Generate interactive tables with contenteditable cells
- Add sort buttons on column headers
- Include sum/total rows at the bottom
- Make tables responsive with horizontal scroll on mobile
- Use professional styling with alternating row colors
` : ""}

${agentType === "resume" ? `
RESUME RULES:
- Use ONLY the data provided by the user. Do NOT invent any information.
- Include all sections: Contact Info, Summary, Experience, Education, Skills, Projects, Languages, Certifications.
- Professional, clean design with proper typography.
` : ""}

${agentType === "roadmap" ? "Generate a visual project roadmap as HTML with timeline-based layout, milestones, and phases." : ""}
${agentType === "mindmap" ? "Generate a visual mind map as HTML with hierarchical nodes, connecting lines, and proper spacing." : ""}
${agentType === "timeline" ? "Generate a visual chronological timeline as HTML with events, dates, and descriptions." : ""}

After the HTML content, write a personalized summary starting with ---SUMMARY--- on a new line.
The summary should describe exactly what you created, what sections it contains, and its key content.
As you work, output [STATUS: description] markers to show progress.`;

    let prompt = `User request: ${userInput}`;
    if (researchContent) prompt += `\n\nResearch data to use (verified information):\n${researchContent.slice(0, 6000)}`;

    // Fetch Pexels images for relevant types
    if (["slides", "document", "report", "roadmap", "timeline"].includes(agentType) && !userInput.toLowerCase().includes("no image")) {
      addResearchStep("Finding relevant images...");
      try {
        const { data: imgData } = await supabase.functions.invoke("search", { body: { query: `${userInput} high quality photos` } });
        const urls = Array.isArray(imgData?.images) ? imgData.images.slice(0, 6) : [];
        if (urls.length) prompt += `\n\nRelevant images you may use (only if contextually appropriate):\n${urls.map((u: string, i: number) => `${i + 1}. ${u}`).join("\n")}`;
      } catch {}
    }

    textFiles.forEach(f => { prompt += `\n\n--- Attached: ${f.name} ---\n${f.data}`; });

    const userMessage: any = imageFiles.length > 0
      ? { role: "user", content: [
          { type: "text", text: prompt },
          ...imageFiles.map(img => ({ type: "image_url", image_url: { url: img.data } }))
        ]}
      : { role: "user", content: prompt };

    addResearchStep("Writing content...");
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, userMessage],
        model: "moonshotai/kimi-k2.5:nitro",
        mode: "files",
      }),
    });

    if (!resp.ok || !resp.body) {
      pushMessage({ role: "assistant", content: "Generation failed. Please try again." });
      return;
    }

    let content = await readSSEStreamWithStatus(resp.body, (status) => {
      addResearchStep(status);
    });

    // Check if AI decided to chat instead of generate
    const hasHtml = /<!doctype html|<html[\s>]|<body[\s>]|<div[\s>]|<section[\s>]|<table[\s>]/i.test(content);
    if (!hasHtml && !content.includes("---SUMMARY---")) {
      // Chat mode - just show the response
      const cleanContent = content.replace(/\[STATUS:\s*.*?\]/g, "").replace(/---SUMMARY---[\s\S]*$/, "").trim();
      pushMessage({ role: "assistant", content: cleanContent });
      if (convId) await saveMsg(convId, "assistant", cleanContent);
      return;
    }

    let summary = "";
    const summaryMatch = content.match(/---SUMMARY---([\s\S]*?)$/);
    if (summaryMatch) {
      summary = summaryMatch[1].replace(/\[STATUS:\s*.*?\]/g, "").trim();
      content = content.replace(/---SUMMARY---[\s\S]*$/, "").trim();
    }
    content = content.replace(/\[STATUS:\s*.*?\]/g, "").trim();

    const html = buildPreviewHtml({ content, agent: activeAgent, request: userInput });
    const desc = summary || "Your file is ready. Tap Preview to view it.";

    pushMessage({ role: "assistant", content: desc, htmlContent: html });
    if (convId) await saveMsg(convId, "assistant", desc, { htmlContent: html });
    setPreviewHtml(html);
    if (!isMobile) setActiveTab("preview");
  };

  const pushMessage = (msg: ChatMsg) => {
    setUndoStack(prev => [...prev, messages]);
    setRedoStack([]);
    setMessages(prev => [...prev, msg]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, messages]);
    setMessages(undoStack[undoStack.length - 1]);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, messages]);
    setMessages(redoStack[redoStack.length - 1]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleGenerate = useCallback(async (overrideInput?: string) => {
    const userInput = overrideInput || input;
    if (!userInput.trim() && attachedFiles.length === 0) return;

    const userContent = userInput || `[Attached ${attachedFiles.length} file(s)]`;
    pushMessage({ role: "user", content: userContent });
    setInput("");
    const files = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);
    setStatusText("Starting...");
    setResearchSteps([]);
    if (isMobile) setActiveTab("chat");

    const convId = await getOrCreateConversation(userContent);
    if (convId) await saveMsg(convId, "user", userContent);

    try {
      const isSlides = activeAgent === "slides";
      const needsResearch = ["slides", "report", "document", "roadmap", "mindmap", "timeline", "spreadsheet"].includes(activeAgent || "");

      let research = "";
      if (needsResearch && activeAgent !== "resume" && activeAgent !== "letter") {
        research = await doResearchWithStreaming(userInput);
      }

      if (isSlides) {
        const result = await generateSlides(userInput, research, convId);
        if (!result) {
          await generateHtmlFile(userInput, files, research, convId);
        }
      } else {
        await generateHtmlFile(userInput, files, research, convId);
      }

      // Refresh saved files
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("conversations").select("id, title, created_at, mode").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(20);
        if (data) setSavedFiles(data as SavedFile[]);
      }
    } catch (e) {
      console.error("Generation error:", e);
      pushMessage({ role: "assistant", content: "Something went wrong. Please try again." });
    }

    setIsGenerating(false);
    setStatusText("");
    setResearchSteps([]);
  }, [input, attachedFiles, activeAgent, conversationId, selectedTemplate, isMobile]);

  const newChat = () => {
    setMessages([]); setInput(""); setPreviewHtml(null); setAttachedFiles([]);
    setConversationId(null); setActiveAgent(null); setStatusText("");
    setShowTemplates(false); setSelectedTemplate(null); setResearchSteps([]);
    setActiveTab("chat"); setUndoStack([]); setRedoStack([]);
  };

  const hasMessages = messages.length > 0;

  // Desktop: split pane. Mobile: tabs.
  const showPreviewPanel = !isMobile && previewHtml && hasMessages;

  const chatPanel = (
    <div className="flex flex-col h-full">
      {/* Mobile header */}
      {isMobile && (
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 liquid-glass">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          {hasMessages && previewHtml && (
            <div className="flex gap-1 liquid-glass-subtle rounded-xl p-1">
              <button onClick={() => setActiveTab("chat")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Chat</button>
              <button onClick={() => setActiveTab("preview")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Preview</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            {undoStack.length > 0 && (
              <button onClick={handleUndo} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"><Undo2 className="w-4 h-4" /></button>
            )}
            {redoStack.length > 0 && (
              <button onClick={handleRedo} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"><Redo2 className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4">
            <div className="flex-1" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl w-full">
              <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-3">
                <span className="text-foreground">CREATE</span><br />
                <span className="bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">ANYTHING</span>
              </h1>
              <p className="text-muted-foreground/50 text-sm mb-10 max-w-xs mx-auto">
                Slides, documents, resumes, reports — powered by AI
              </p>

              {/* Input area */}
              <div className="max-w-xl mx-auto mb-5">
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
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey && !isMobile) { e.preventDefault(); handleGenerate(); }
                      }}
                      placeholder="Describe what you want to create..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none min-h-[60px] max-h-[160px] py-1"
                      rows={3}
                      enterKeyHint="enter"
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

              {/* Services */}
              <div className="max-w-xl mx-auto mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
                  {FILE_SERVICES.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => setActiveAgent(activeAgent === svc.id ? null : svc.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap shrink-0 transition-all ${
                        activeAgent === svc.id
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "liquid-glass-button text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <span className="font-medium">{svc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spreadsheet templates */}
              {activeAgent === "spreadsheet" && (
                <div className="max-w-xl mx-auto mb-6">
                  <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3 text-left px-1">Quick Templates</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
                    {SPREADSHEET_TEMPLATES.map(tmpl => (
                      <button key={tmpl.label} onClick={() => { setInput(tmpl.prompt); }} className="px-4 py-2 rounded-xl liquid-glass-button text-xs text-foreground/70 hover:text-foreground whitespace-nowrap shrink-0">
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Slide templates */}
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
                              <img src={tmpl.image_url} alt="Template" className="w-full h-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                  {savedFiles.slice(0, 6).map(f => (
                    <motion.button key={f.id} whileTap={{ scale: 0.98 }} onClick={() => loadConversation(f.id)} className="w-full flex items-center gap-3 p-3 rounded-2xl liquid-glass-button text-left">
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
          <div className="max-w-2xl mx-auto py-4 px-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex justify-end mb-4">
                    <div className="max-w-[85%] liquid-glass-subtle text-foreground px-4 py-2.5 rounded-[1.6rem] rounded-br-md text-sm leading-relaxed select-text">{msg.content}</div>
                  </div>
                ) : (
                  <div className="mb-4 space-y-3">
                    <div className="prose-chat text-foreground text-sm select-text">
                      <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "").replace(/```html[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim()}</ReactMarkdown>
                    </div>
                    {(msg.htmlContent || msg.downloadUrl) && (
                      <div className="flex gap-2 flex-wrap">
                        {msg.htmlContent && (
                          <>
                            <button onClick={() => { setPreviewHtml(msg.htmlContent!); if (isMobile) setActiveTab("preview"); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-glass-button text-sm font-medium text-foreground hover:text-primary transition-colors">
                              <Eye className="w-4 h-4" /> Preview
                            </button>
                            <button onClick={() => { setExportHtml(msg.htmlContent!); setShowExport(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-glass-button text-sm text-foreground">
                              <Download className="w-4 h-4" /> Download
                            </button>
                          </>
                        )}
                        {msg.downloadUrl && (
                          <a href={msg.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                            <Download className="w-4 h-4" /> Download
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isGenerating && researchSteps.length > 0 && <ResearchFlow steps={researchSteps} />}
            {isGenerating && researchSteps.length === 0 && <ThinkingLoader searchStatus={statusText || "Working..."} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom input */}
      {hasMessages && (
        <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-2xl mx-auto">
            {attachedFiles.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-button text-xs text-foreground">
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="liquid-glass rounded-2xl overflow-hidden">
              <div className="flex items-end gap-2 px-3 py-2">
                <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors self-end">
                  <Plus className="w-5 h-5" />
                </button>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey && !isMobile) { e.preventDefault(); handleGenerate(); }
                  }}
                  placeholder="Ask for changes..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none min-h-[24px] max-h-[120px] py-2 select-text"
                  rows={1}
                  enterKeyHint="enter"
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

      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,.xlsx,.pptx,image/*" multiple className="hidden" onChange={handleFileAttach} />
    </div>
  );

  const previewPanel = previewHtml ? (
    <FilePreviewPanel
      html={previewHtml}
      title={messages.find(m => m.role === "user")?.content?.slice(0, 50) || "Preview"}
      onClose={() => { if (isMobile) setActiveTab("chat"); else setPreviewHtml(null); }}
      onEdit={() => { if (isMobile) setActiveTab("chat"); }}
      onDownload={() => { setExportHtml(previewHtml); setShowExport(true); }}
    />
  ) : null;

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={newChat} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background overflow-x-hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={newChat} onSelectConversation={loadConversation} activeConversationId={conversationId} currentMode="files" />

        {/* Export dialog */}
        <ExportDialog open={showExport} onClose={() => setShowExport(false)} html={exportHtml} fileName={activeAgent || "document"} isSpreadsheet={activeAgent === "spreadsheet"} />

        {/* Layout */}
        {isMobile ? (
          <div className="flex-1 min-h-0">
            {activeTab === "chat" ? chatPanel : (previewPanel || chatPanel)}
          </div>
        ) : (
          <div className={`flex-1 min-h-0 ${showPreviewPanel ? "grid grid-cols-[minmax(350px,2fr)_3fr]" : "flex flex-col"}`}>
            {showPreviewPanel ? (
              <>
                <div className="border-r border-border/20 overflow-hidden">{chatPanel}</div>
                <div className="overflow-hidden relative">{previewPanel}</div>
              </>
            ) : (
              chatPanel
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FilesPage;
