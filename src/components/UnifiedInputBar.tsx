import { useState, useEffect } from "react";
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

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  return (
    <div className={`rounded-2xl bg-gradient-to-r from-rose-400/15 via-purple-400/15 to-blue-400/15 border border-border/20 p-4 ${className}`}>
      {/* Attached image preview */}
      {attachedImage && (
        <div className="mb-3 relative inline-block">
          <img src={attachedImage} alt="" className="w-16 h-16 object-cover rounded-xl" />
          <button
            onClick={onClearAttachment}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2.5">
        {/* + button for attachments */}
        {onAttach && (
          <button
            onClick={onAttach}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {/* Model picker button (hub pages only) */}
        {showModelPicker && onModelPick && (
          <button
            onClick={onModelPick}
            className="shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all"
          >
            {modelIcon ? (
              <img src={modelIcon} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">M</div>
            )}
          </button>
        )}

        {/* Text input */}
        <input
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
          placeholder={placeholders[placeholderIdx]}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50 py-2.5"
        />

        {/* Generate button - inside the border */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-30 transition-all"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : (
            generateLabel
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default UnifiedInputBar;
