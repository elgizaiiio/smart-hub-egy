import { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uiText } from "@/lib/uiLanguage";

interface SmartQuestion {
  title: string;
  options: string[];
  allowText?: boolean;
}

interface AnimatedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onPlusClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholders?: string[];
  pendingQuestions?: SmartQuestion[];
  onQuestionAnswer?: (answer: string) => void;
  onQuestionSkip?: () => void;
  editingLabel?: string | null;
  onCancelEditing?: () => void;
}

const DEFAULT_PLACEHOLDERS = [
  "Ask Megsy ?",
  "What's on your mind?",
  "Ask anything...",
];

const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading, placeholders, pendingQuestions, onQuestionAnswer, onQuestionSkip, editingLabel, onCancelEditing }: AnimatedInputProps) => {
  const items = placeholders || DEFAULT_PLACEHOLDERS;
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * items.length));
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionInput, setQuestionInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasQuestions = pendingQuestions && pendingQuestions.length > 0;
  const currentQuestion = hasQuestions ? pendingQuestions![questionIndex] : null;

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
      const maxH = typeof window !== 'undefined' && window.innerWidth < 768 ? 120 : 160;
      el.style.height = Math.min(el.scrollHeight, maxH) + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const handleQuestionSelect = (option: string) => {
    onQuestionAnswer?.(option);
    if (questionIndex < (pendingQuestions?.length || 0) - 1) {
      setQuestionIndex((p) => p + 1);
    } else {
      setQuestionIndex(0);
    }
  };

  const handleQuestionTextSend = () => {
    if (!questionInput.trim()) return;
    onQuestionAnswer?.(questionInput.trim());
    setQuestionInput("");
    if (questionIndex < (pendingQuestions?.length || 0) - 1) {
      setQuestionIndex((p) => p + 1);
    } else {
      setQuestionIndex(0);
    }
  };

  return (
    <div className="relative">
      <div className="theme-animated-surface rounded-[1.9rem] border border-border/70 overflow-hidden shadow-[0_18px_60px_-30px_hsl(var(--foreground)/0.5)]">
        {editingLabel && (
          <div className="theme-animated-surface flex items-center justify-between gap-3 border-b border-border/40 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-primary">{uiText({ ar: "وضع التعديل", en: "Editing mode" })}</p>
              <p className="truncate text-xs text-muted-foreground">{editingLabel}</p>
            </div>
            <button
              onClick={onCancelEditing}
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              {uiText({ ar: "إلغاء", en: "Cancel" })}
            </button>
          </div>
        )}

        {/* Smart Questions Panel - inside the input container */}
        <AnimatePresence>
          {hasQuestions && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="theme-animated-surface border-b border-border/40"
            >
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{currentQuestion.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{questionIndex + 1}/{pendingQuestions!.length}</span>
                    <button onClick={onQuestionSkip} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mb-2.5 text-[11px] text-muted-foreground">{uiText({ ar: "اضغط على أي مربع أدناه لتختار ما تريد أو اكتب إجابتك بالأسفل.", en: "Tap any box below to choose what you want, or type your answer below." })}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuestionSelect(opt)}
                      className="theme-animated-surface min-h-[60px] px-3.5 py-3 rounded-[1.25rem] border border-border/50 text-xs font-medium text-foreground hover:bg-accent/50 hover:border-primary/30 active:scale-[0.98] transition-all duration-200 text-start"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {currentQuestion.allowText && (
                  <div className="theme-animated-surface flex items-center gap-2 mt-3 rounded-2xl border border-border/40 px-3 py-2">
                    <input
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuestionTextSend()}
                      placeholder={uiText({ ar: "اكتب إجابتك...", en: "Type your own answer..." })}
                      className="flex-1 bg-transparent border-none px-0.5 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                    <button
                      onClick={handleQuestionTextSend}
                      disabled={!questionInput.trim()}
                      className="unlock-pro-button w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground disabled:opacity-30 transition-opacity"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="relative flex items-end gap-2 px-3 py-3.5">
          <button
            onClick={onPlusClick}
            className="theme-animated-surface shrink-0 w-11 h-11 flex items-center justify-center rounded-full border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/35 active:scale-95 transition-all mb-0.5"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { onChange(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={displayedPlaceholder}
              rows={1}
                className="w-full bg-transparent border-none outline-none resize-none text-[15px] leading-7 text-foreground placeholder:text-muted-foreground/40 py-2.5 px-1"
                style={{ minHeight: "52px" }}
            />
          </div>

          {isLoading ? (
            <button
              onClick={onCancel}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all animate-pulse-slow mb-0.5"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 mb-0.5 disabled:opacity-25 disabled:cursor-not-allowed ${value.trim() ? "unlock-pro-button text-primary-foreground shadow-[0_14px_32px_-18px_hsl(var(--primary)/0.9)]" : "bg-background/35 text-foreground hover:bg-muted-foreground/10"}`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedInput;
