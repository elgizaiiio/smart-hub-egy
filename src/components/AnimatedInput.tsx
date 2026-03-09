import { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, Square, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ModelOption } from "./ModelSelector";
import { getModelsForMode } from "./ModelSelector";

interface AnimatedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onPlusClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholders?: string[];
  selectedModel?: ModelOption;
  onModelChange?: (model: ModelOption) => void;
}

const DEFAULT_PLACEHOLDERS = [
  "How can I help you today?",
  "What's on your mind?",
  "Ask anything...",
];

const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading, placeholders, selectedModel, onModelChange }: AnimatedInputProps) => {
  const items = placeholders || DEFAULT_PLACEHOLDERS;
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * items.length));
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value) return;
    const target = items[placeholderIndex];
    let charIndex = 0;
    setIsTyping(true);
    setDisplayedPlaceholder("");

    const typeInterval = setInterval(() => {
      if (charIndex < target.length) {
        setDisplayedPlaceholder(target.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % items.length);
        }, 2500);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [placeholderIndex, value, items]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) onSend();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 128) + "px";
    }
  };

  return (
    <div className="relative">
      <div className="relative flex flex-col rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-md overflow-hidden">
        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={displayedPlaceholder}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 px-4 pt-3 pb-1 max-h-32"
          style={{ minHeight: "36px" }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <button
            onClick={onPlusClick}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-2">
            {/* Model name */}
            {selectedModel && (
              <span className="text-xs text-muted-foreground/60 font-medium">
                {selectedModel.name}
              </span>
            )}

            {/* Send / Stop */}
            {isLoading ? (
              <button
                onClick={onCancel}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all animate-pulse-slow"
              >
                <Square className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!value.trim() || disabled}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-muted/50 text-foreground hover:bg-muted-foreground/20 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedInput;
