import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="files" />

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
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
            onSend={() => {}}
            onPlusClick={() => setMenuOpen(!menuOpen)}
            placeholders={FILE_PLACEHOLDERS}
          />
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx" />
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
