import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Paperclip } from "lucide-react";

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
  const [iconError, setIconError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resolvedIcon = modelIcon && !iconError ? modelIcon : "/model-logos/bytedance.ico";

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => { setIconError(false); }, [modelIcon]);

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
          <button onClick={onModelPick} className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg hover:bg-accent/50 transition-all">
            <img
              src={resolvedIcon}
              alt="Model"
              className="h-5 w-5 rounded object-contain"
              onError={() => setIconError(true)}
            />
          </button>
        )}

        {onAttach && (
          <button onClick={onAttach} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <Paperclip className="w-[18px] h-[18px]" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
          placeholder={placeholders[placeholderIdx]}
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
