import { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, Square, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ModelOption } from "./ModelSelector";
import { getModelsForMode, ModelBrandIcon } from "./ModelSelector";

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
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

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

  // Close model menu on outside click
  useEffect(() => {
    if (!modelMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modelMenuOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) onSend();
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const maxH = isMobile ? 96 : 128;
      el.style.height = Math.min(el.scrollHeight, maxH) + "px";
    }
  };

  const chatModels = getModelsForMode("chat");

  return (
    <div className="relative">
      <div className="relative flex flex-col rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-md overflow-visible">
        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={displayedPlaceholder}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 px-4 pt-3 pb-1"
          style={{ minHeight: "36px" }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onPlusClick}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>

            {/* Desktop model selector */}
            {selectedModel && onModelChange && (
              <div className="hidden md:block relative" ref={modelMenuRef}>
                <button
                  onClick={() => setModelMenuOpen(!modelMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  
                  <span>{selectedModel.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {modelMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full mb-2 left-0 z-50 w-56 rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
                    >
                      {chatModels.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { onModelChange(m); setModelMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                            selectedModel.id === m.id
                              ? "bg-accent text-accent-foreground"
                              : "text-popover-foreground hover:bg-accent/50"
                          }`}
                        >
                          <ModelBrandIcon modelId={m.id} />
                          <span className="font-medium">{m.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
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
