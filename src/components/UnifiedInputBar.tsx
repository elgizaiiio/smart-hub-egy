import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Image } from "lucide-react";

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

  const resolvedIcon = !iconFailed && modelIcon ? modelIcon : null;

  return (
    <div className={`rounded-2xl border border-border/20 bg-card/80 backdrop-blur-sm shadow-sm ${className}`}>
      {attachedImage && (
        <div className="px-3.5 pt-3 relative inline-block">
          <img src={attachedImage} alt="Attached" className="h-16 w-16 rounded-xl object-cover border border-border/30" />
          <button
            onClick={onClearAttachment}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        {/* Media attach button */}
        {onAttach && (
          <button
            onClick={onAttach}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Image className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* Model picker button */}
        {showModelPicker && onModelPick && (
          <button
            onClick={onModelPick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card overflow-hidden hover:border-primary/30 transition-all"
          >
            {resolvedIcon ? (
              <img
                src={resolvedIcon}
                alt="Model"
                className="h-6 w-6 rounded-lg object-contain"
                onError={() => setIconFailed(true)}
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">AI</div>
            )}
          </button>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
          placeholder={placeholders[placeholderIdx]}
          className="min-h-[36px] max-h-[140px] flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground/50"
        />

        {/* Generate button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all disabled:opacity-30"
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
