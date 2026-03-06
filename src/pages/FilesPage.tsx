import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Loader2, Eye, Download, X } from "lucide-react";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AnimatedInput from "@/components/AnimatedInput";

const SUGGESTIONS = [
  { title: "Write a professional report", icon: "📄" },
  { title: "Create a presentation", icon: "📊" },
  { title: "Summarize this document", icon: "📝" },
  { title: "Convert image to PDF", icon: "🖼️" },
];

const FILE_PLACEHOLDERS = [
  "Write a professional report...",
  "Create a presentation outline...",
  "Summarize a document...",
  "Analyze data from a CSV...",
  "Convert and format files...",
];

const FilesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Generate a complete, well-formatted HTML document for the following request. Include proper styling with CSS. Output ONLY the HTML code, no explanations:\n\n${input}` }],
          model: "google/gemini-3-flash-preview",
        }),
      });

      if (!resp.ok || !resp.body) {
        toast.error("Generation failed");
        setIsGenerating(false);
        return;
      }

      // Stream the response
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

      // Extract HTML from markdown code blocks if wrapped
      let html = content;
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) html = htmlMatch[1];

      setGeneratedContent(html);
      toast.success("File generated!");
    } catch {
      toast.error("Generation failed");
    }
    setIsGenerating(false);
  };

  const handleDownload = (format: string) => {
    if (!generatedContent) return;
    let blob: Blob;
    let filename: string;

    if (format === "html") {
      blob = new Blob([generatedContent], { type: "text/html" });
      filename = "document.html";
    } else if (format === "txt") {
      // Strip HTML tags
      const tmp = document.createElement("div");
      tmp.innerHTML = generatedContent;
      blob = new Blob([tmp.textContent || ""], { type: "text/plain" });
      filename = "document.txt";
    } else {
      blob = new Blob([generatedContent], { type: "text/markdown" });
      filename = "document.md";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setGeneratedContent(null); setInput(""); }} currentMode="files" />

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4">
        {previewOpen && generatedContent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Preview</p>
              <div className="flex gap-2">
                <button onClick={() => handleDownload("html")} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent">.HTML</button>
                <button onClick={() => handleDownload("txt")} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent">.TXT</button>
                <button onClick={() => handleDownload("md")} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent">.MD</button>
                <button onClick={() => setPreviewOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe srcDoc={generatedContent} className="flex-1 w-full bg-white rounded-b-lg" sandbox="allow-scripts" />
          </motion.div>
        ) : generatedContent ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">File Ready!</h3>
            <p className="text-sm text-muted-foreground mb-6">Your document has been generated</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setPreviewOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={() => handleDownload("html")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm hover:bg-accent">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </motion.div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Generating your file...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Create anything with files</h2>
            <p className="text-sm text-muted-foreground mb-8">Generate documents, analyze files, create presentations and more</p>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setInput(s.title)}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/50 transition-all text-left"
                >
                  <p className="text-sm text-foreground">{s.title}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="shrink-0 px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto relative">
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56">
                <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Attach Document</span>
                </button>
              </motion.div>
            </>
          )}
          <AnimatedInput
            value={input}
            onChange={setInput}
            onSend={handleGenerate}
            onPlusClick={() => setMenuOpen(!menuOpen)}
            disabled={isGenerating}
            isLoading={isGenerating}
            placeholders={FILE_PLACEHOLDERS}
          />
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx" />
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
