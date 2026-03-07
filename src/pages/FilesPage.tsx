import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Loader2, Eye, Download, X, Globe, Image, Mail, HardDrive } from "lucide-react";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  htmlContent?: string;
}

const SUGGESTIONS = [
  { title: "Write a professional report" },
  { title: "Create a presentation" },
  { title: "Summarize this document" },
  { title: "Convert image to PDF" },
];

const FILE_PLACEHOLDERS = [
  "Write a professional report...",
  "Create a presentation outline...",
  "Summarize a document...",
  "Analyze data from a CSV...",
];

const FilesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleGenerate = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setIsGenerating(true);

    try {
      // First generate the HTML document
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Generate a complete, well-formatted, comprehensive and detailed HTML document for the following request. Include proper styling with CSS, make it look professional and polished. Output ONLY the HTML code, no explanations:\n\n${userInput}` }],
          model: "google/gemini-3-flash-preview",
          mode: "files",
        }),
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
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) content += delta;
          } catch { /* skip */ }
        }
      }

      let html = content;
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) html = htmlMatch[1];

      // Now generate AI description
      const descResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
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
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]);
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
    <div className="h-[100dvh] flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setMessages([]); setInput(""); setPreviewHtml(null); }} currentMode="files" />

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

      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Create anything with files</h2>
              <p className="text-sm text-muted-foreground mb-6">Generate documents, analyze files, create presentations and more</p>
              <div className="grid grid-cols-2 gap-3">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => setInput(s.title)} className="p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/50 transition-all text-left">
                    <p className="text-sm text-foreground">{s.title}</p>
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

      <div className="shrink-0 px-3 pb-3 pt-1">
        <div className="max-w-3xl mx-auto relative">
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-64">
                  {/* Web Search toggle */}
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

                  <button onClick={() => { imageInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Attach Image</span>
                  </button>
                  <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Attach Document</span>
                  </button>

                  <div className="border-t border-border mt-1 pt-1">
                    <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Agents</p>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" /> Email
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">PRO</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
                      <HardDrive className="w-4 h-4 text-muted-foreground" /> Google Drive
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">PRO</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 backdrop-blur-xl px-3 py-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={displayedPlaceholder + "│"}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
              style={{ minHeight: "32px" }}
            />
            <button onClick={handleGenerate} disabled={!input.trim() || isGenerating} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx" />
          <input ref={imageInputRef} type="file" className="hidden" accept="image/*" />
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
