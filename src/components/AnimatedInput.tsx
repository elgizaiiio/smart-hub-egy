import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Plus, ArrowUp, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MentionDropdown from "./MentionDropdown";
import AgentBadge from "./AgentBadge";
import type { AgentDef } from "@/lib/agentRegistry";

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
  activeAgent?: string | null;
  onAgentSelect?: (agent: AgentDef) => void;
  onAgentRemove?: () => void;
  mentionCategories?: string[];
}

const DEFAULT_PLACEHOLDERS = [
  "Ask Megsy ?",
  "What's on your mind?",
  "Ask anything...",
];

const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading, placeholders, pendingQuestions, onQuestionAnswer, onQuestionSkip, activeAgent, onAgentSelect, onAgentRemove, mentionCategories }: AnimatedInputProps) => {
  const items = useMemo(() => placeholders && placeholders.length > 0 ? placeholders : DEFAULT_PLACEHOLDERS, [placeholders]);
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * items.length));
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionInput, setQuestionInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // Keep valueRef in sync without triggering placeholder effect
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const hasQuestions = !!pendingQuestions?.length;
  const safeQuestionIndex = hasQuestions ? Math.min(questionIndex, pendingQuestions!.length - 1) : 0;
  const currentQuestion = hasQuestions ? pendingQuestions![safeQuestionIndex] : null;

  // Placeholder typing animation - only depends on placeholderIndex and items, NOT value
  useEffect(() => {
    if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
    if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);

    // If there's text, don't animate
    if (valueRef.current) {
      setDisplayedPlaceholder("");
      return;
    }

    const target = items[placeholderIndex] || DEFAULT_PLACEHOLDERS[0];
    let charIndex = 0;
    setDisplayedPlaceholder("");

    placeholderIntervalRef.current = setInterval(() => {
      // Stop if user started typing
      if (valueRef.current) {
        if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
        setDisplayedPlaceholder("");
        return;
      }
      if (charIndex < target.length) {
        setDisplayedPlaceholder(target.slice(0, charIndex + 1));
        charIndex += 1;
      } else {
        if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
        placeholderTimeoutRef.current = setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % items.length);
        }, 2500);
      }
    }, 50);

    return () => {
      if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
      if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
    };
  }, [placeholderIndex, items]);

  // Clear placeholder when user types
  useEffect(() => {
    if (value) {
      setDisplayedPlaceholder("");
      if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
      if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
    } else if (!value && !placeholderIntervalRef.current) {
      // Restart animation when input becomes empty
      setPlaceholderIndex((prev) => (prev + 1) % items.length);
    }
  }, [value, items]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && mentionOpen) {
      setMentionOpen(false);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mentionOpen) { setMentionOpen(false); return; }
      if (value.trim() && !disabled && !isLoading) onSend();
    }
  };

  // Detect @ mention typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    
    // Check for @ at cursor position
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newVal.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (agent: AgentDef) => {
    // Remove the @query from input
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const cleanedBefore = textBeforeCursor.replace(/@\w*$/, "");
    const textAfter = value.slice(cursorPos);
    onChange(cleanedBefore + textAfter);
    setMentionOpen(false);
    setMentionQuery("");
    onAgentSelect?.(agent);
  };

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const maxH = typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 160;
      el.style.height = Math.min(el.scrollHeight, maxH) + "px";
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  useEffect(() => {
    setQuestionIndex(0);
    setQuestionInput("");
  }, [pendingQuestions]);

  const moveToNextQuestion = () => {
    if (!pendingQuestions?.length) return;
    if (safeQuestionIndex < pendingQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setQuestionIndex(0);
    }
    setQuestionInput("");
  };

  const handleQuestionSelect = (option: string) => {
    onQuestionAnswer?.(option);
    moveToNextQuestion();
  };

  const handleQuestionTextSend = () => {
    if (!questionInput.trim()) return;
    onQuestionAnswer?.(questionInput.trim());
    moveToNextQuestion();
  };

  return (
    <div className="relative">
      <div className="rounded-[2rem] border border-border/50 bg-background/35 backdrop-blur-xl overflow-hidden shadow-[0_18px_60px_hsl(var(--foreground)/0.08)]">
        <AnimatePresence>
          {hasQuestions && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border/30 bg-secondary/15"
            >
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-sm font-medium text-foreground">{currentQuestion.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{safeQuestionIndex + 1}/{pendingQuestions!.length}</span>
                    <button onClick={onQuestionSkip} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" aria-label="Skip smart question">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={`${opt}-${i}`}
                      onClick={() => handleQuestionSelect(opt)}
                      className="px-3 py-1.5 rounded-full border border-border/40 bg-background/60 text-xs text-foreground hover:bg-accent/40 hover:border-primary/30 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {currentQuestion.allowText && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      autoComplete="off"
                      dir="auto"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") { e.preventDefault(); handleQuestionTextSend(); }
                      }}
                      placeholder="Type your answer..."
                      className="flex-1 bg-transparent border-none px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                    <button
                      onClick={handleQuestionTextSend}
                      disabled={!questionInput.trim()}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                      aria-label="Send question answer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-2 px-3 py-3">
          <button
            onClick={onPlusClick}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-0 bg-transparent shadow-none text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open attachments"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayedPlaceholder || " "}
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 py-2 px-1"
              style={{ minHeight: "36px" }}
            />
          </div>

          {isLoading ? (
            <button
              onClick={onCancel}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all animate-pulse-slow"
              aria-label="Stop generation"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted-foreground/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="Send message"
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
