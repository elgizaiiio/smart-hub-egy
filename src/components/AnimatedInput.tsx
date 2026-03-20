import { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

const DEFAULT_PLACEHOLDERS = [
  "Ask Megsy ?",
  "What's on your mind?",
  "Ask anything...",
];

const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading, placeholders, pendingQuestions, onQuestionAnswer, onQuestionSkip }: AnimatedInputProps) => {
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
      {/* Smart Questions Panel */}
      <AnimatePresence>
        {hasQuestions && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 rounded-2xl border border-border/40 bg-secondary/60 backdrop-blur-md p-3.5"
          >
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-medium text-foreground">{currentQuestion.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{questionIndex + 1}/{pendingQuestions!.length}</span>
                <button onClick={onQuestionSkip} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuestionSelect(opt)}
                  className="w-full text-left px-3 py-2 rounded-xl border border-border/30 bg-background/50 text-sm text-foreground hover:bg-accent/40 hover:border-primary/30 transition-colors"
                >
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {opt}
                </button>
              ))}
            </div>
            {currentQuestion.allowText && (
              <div className="flex items-center gap-2 mt-2.5">
                <input
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuestionTextSend()}
                  placeholder="Type your answer..."
                  className="flex-1 bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                />
                <button
                  onClick={handleQuestionTextSend}
                  disabled={!questionInput.trim()}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar - borderless */}
      <div className="relative flex items-end gap-2 px-1 py-2">
        <button
          onClick={onPlusClick}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors mb-0.5"
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
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 py-1.5 px-1"
            style={{ minHeight: "28px" }}
          />
        </div>

        {isLoading ? (
          <button
            onClick={onCancel}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all animate-pulse-slow mb-0.5"
          >
            <Square className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-foreground hover:bg-muted-foreground/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed mb-0.5"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimatedInput;
