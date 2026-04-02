import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface UnifiedInputBarProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onAttach?: () => void;
  onModelPick?: () => void;
  modelIcon?: string | null;
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
  "Let's make your dreams come true...",
  "Turn your ideas into art...",
  "Describe what you imagine...",
];

const UnifiedInputBar = ({
  prompt,
  onPromptChange,
  onGenerate,
  onAttach,
  onModelPick,
  modelIcon,
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
  const [iconFailed, setIconFailed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resolvedModelIcon = !iconFailed && (modelIcon || "/model-logos/bytedance.ico")
    ? (modelIcon || "/model-logos/bytedance.ico")
    : null;

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    setIconFailed(false);
  }, [modelIcon]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [prompt]);

  return (
    <div className={`rounded-[1.75rem] border border-border/30 bg-gradient-to-br from-card via-card to-accent/40 p-3 shadow-sm ${className}`}>
      {attachedImage && (
        <div className="mb-3 relative inline-block">
          <img src={attachedImage} alt="Attached reference" className="h-20 w-20 rounded-2xl object-cover border border-border/30" />
          <button
            onClick={onClearAttachment}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2.5 rounded-[1.4rem] border border-border/20 bg-background/75 px-2.5 py-2.5">
        {onAttach && (
          <button
            onClick={onAttach}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {showModelPicker && onModelPick && (
          <button
            onClick={onModelPick}
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/30 bg-card transition-all hover:border-primary/30 hover:bg-accent"
          >
            {resolvedModelIcon ? (
              <img src={resolvedModelIcon} alt="Model" className="h-9 w-9 rounded-xl bg-background/80 object-contain p-1" onError={() => setIconFailed(true)} />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary">M</div>
            )}
          </button>
        )}

        <textarea
          ref={textareaRef}
          rows={2}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
          placeholder={placeholders[placeholderIdx]}
          className="min-h-[64px] flex-1 resize-none bg-transparent px-1 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/55"
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="shrink-0 self-stretch rounded-[1.15rem] bg-foreground px-5 text-sm font-semibold text-background transition-all disabled:opacity-30 min-w-[92px]"
        >
          {isGenerating ? (
            <div className="mx-auto h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
          ) : (
            generateLabel
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default UnifiedInputBar;
