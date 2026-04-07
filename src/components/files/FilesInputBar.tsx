import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Paperclip, Image, Globe, ArrowUp, Loader2, X, FileText } from "lucide-react";
import AgentBadge from "@/components/AgentBadge";
import MentionDropdown from "@/components/MentionDropdown";
import type { AgentDef } from "@/lib/agentRegistry";

interface AttachedFile {
  name: string;
  type: string;
  data: string;
}

export interface FilesInputBarRef {
  focus: () => void;
}

interface FilesInputBarProps {
  compact?: boolean;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  activeAgent: string | null;
  onAgentChange: (id: string | null) => void;
  attachedFiles: AttachedFile[];
  onAttach: (type: "file" | "image") => void;
  onRemoveAttachment: (index: number) => void;
  searchEnabled: boolean;
  onToggleSearch: () => void;
}

const FILE_PLACEHOLDERS = [
  "Write a professional business proposal...",
  "Create a detailed report about...",
  "Create a structured presentation about...",
  "Summarize this document for me...",
];

const FilesInputBar = forwardRef<FilesInputBarRef, FilesInputBarProps>(({
  compact, input, onInputChange, onSubmit, isGenerating,
  activeAgent, onAgentChange, attachedFiles, onAttach,
  onRemoveAttachment, searchEnabled, onToggleSearch,
}, ref) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);

  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }));

  useEffect(() => { inputRef.current = input; }, [input]);

  // Typewriter placeholder
  useEffect(() => {
    if (inputRef.current) { setDisplayedPlaceholder(""); return; }
    const target = FILE_PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (inputRef.current) { clearInterval(t); setDisplayedPlaceholder(""); return; }
      if (i < target.length) { setDisplayedPlaceholder(target.slice(0, i + 1)); i++; }
      else { clearInterval(t); setTimeout(() => setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length), 2500); }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx]);

  useEffect(() => {
    if (input) setDisplayedPlaceholder("");
    else setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length);
  }, [input]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const minH = focused || input ? 56 : (compact ? 32 : 48);
    el.style.height = Math.max(Math.min(el.scrollHeight, 160), minH) + "px";
  }, [input, focused, compact]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onInputChange(val);
    const cursorPos = e.target.selectionStart;
    const before = val.slice(0, cursorPos);
    const atMatch = before.match(/@(\w*)$/);
    if (atMatch) { setMentionOpen(true); setMentionQuery(atMatch[1]); }
    else { setMentionOpen(false); setMentionQuery(""); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!mentionOpen) onSubmit();
    }
  };

  const handleAgentSelect = (agent: AgentDef) => {
    const cursorPos = textareaRef.current?.selectionStart || input.length;
    const before = input.slice(0, cursorPos).replace(/@\w*$/, "");
    const after = input.slice(cursorPos);
    onInputChange(before + after);
    onAgentChange(agent.id);
    setMentionOpen(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  return (
    <div className={compact ? "max-w-2xl mx-auto w-full" : "max-w-xl mx-auto w-full"}>
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-xs text-foreground">
              {f.type === "image" ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span className="truncate max-w-[100px]">{f.name}</span>
              <button onClick={() => onRemoveAttachment(i)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <AnimatePresence>
          {mentionOpen && (
            <MentionDropdown
              query={mentionQuery}
              onSelect={handleAgentSelect}
              onClose={() => setMentionOpen(false)}
              visible={mentionOpen}
              categories={["files"]}
            />
          )}
        </AnimatePresence>
        <div className={`flex items-end gap-2 rounded-2xl border bg-secondary/80 backdrop-blur-sm px-4 py-3 transition-all ${focused ? "border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.08)]" : "border-border/50"}`}>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-5 h-5" /></button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full mb-2 left-0 z-40 w-48 bg-black/80 backdrop-blur-2xl border border-border/30 rounded-xl shadow-lg p-1">
                  <button onClick={() => { setMenuOpen(false); onAttach("file"); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-white/5"><Paperclip className="w-4 h-4" /> Attach file</button>
                  <button onClick={() => { setMenuOpen(false); onAttach("image"); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-white/5"><Image className="w-4 h-4" /> Attach image</button>
                  <button onClick={() => { setMenuOpen(false); onToggleSearch(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-white/5">
                    <Globe className={`w-4 h-4 ${searchEnabled ? "text-primary" : ""}`} /> {searchEnabled ? "Web search ON" : "Web search"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeAgent && (
                <AgentBadge agentId={activeAgent} onRemove={() => onAgentChange(null)} size="sm" />
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={displayedPlaceholder || "Describe what you need..."}
                rows={1}
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1 max-h-[160px]"
                style={{ minHeight: focused || input ? "56px" : (compact ? "32px" : "48px") }}
              />
            </div>
          </div>
          <button
            onClick={onSubmit}
            disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
});

FilesInputBar.displayName = "FilesInputBar";
export default FilesInputBar;
