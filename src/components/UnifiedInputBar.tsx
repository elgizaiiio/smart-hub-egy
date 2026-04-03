import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";

interface UnifiedInputBarProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onAttach?: () => void;
  onModelPick?: () => void;
  modelIcon?: string | null;
  modelName?: string;
  placeholders?: string[];
  generateLabel?: string;
  disabled?: boolean;
  isGenerating?: boolean;
  attachedImage?: string | null;
  onClearAttachment?: () => void;
  showModelPicker?: boolean;
  className?: string;
}

const DEFAULT_PLACEHOLDERS = [
  "Describe what you imagine...",
  "Turn your ideas into art...",
  "Create stunning visuals with AI...",
];

const UnifiedInputBar = ({
  prompt,
  onPromptChange,
  onGenerate,
  onAttach,
  onModelPick,
  modelName,
  placeholders = DEFAULT_PLACEHOLDERS,
  generateLabel = "Generate",
  disabled,
  isGenerating,
  attachedImage,
  onClearAttachment,
  showModelPicker = false,
  className = "",
}: UnifiedInputBarProps) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typing animation for placeholders
  useEffect(() => {
    const target = placeholders[placeholderIdx];
    if (!target) return;
    
    let charIdx = 0;
    setIsTyping(true);
    setDisplayedPlaceholder("");
    
    const typeInterval = setInterval(() => {
      charIdx++;
      setDisplayedPlaceholder(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        // Wait then move to next
        setTimeout(() => {
          setPlaceholderIdx(i => (i + 1) % placeholders.length);
        }, 2000);
      }
    }, 40);
    
    return () => clearInterval(typeInterval);
  }, [placeholderIdx, placeholders]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [prompt]);

  return (
    <div className={`rounded-2xl bg-card/60 backdrop-blur-sm ${className}`}>
      {attachedImage && (
        <div className="px-3 pt-3 relative inline-block">
          <img src={attachedImage} alt="" className="h-14 w-14 rounded-xl object-cover border border-border/20" />
          <button onClick={onClearAttachment} className="absolute -right-1 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">✕</button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        {showModelPicker && onModelPick && (
          <button
            onClick={onModelPick}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/50 bg-accent/30 px-3 py-2 hover:bg-accent/60 transition-all text-xs font-medium backdrop-blur-sm"
          >
            <span className="text-muted-foreground">Select</span>
            <span className="text-blue-400 font-bold">Model</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        {onAttach && (
          <button onClick={onAttach} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/40 bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
          placeholder={displayedPlaceholder + (isTyping ? "|" : "")}
          className="min-h-[40px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="shrink-0 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition-all disabled:opacity-30"
        >
          {isGenerating ? (
            <div className="mx-auto h-3.5 w-3.5 rounded-full border-2 border-background/30 border-t-background animate-spin" />
          ) : generateLabel}
        </motion.button>
      </div>
    </div>
  );
};

export default UnifiedInputBar;
