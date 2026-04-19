import { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from "react";
import { ArrowUp, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MentionDropdown from "./MentionDropdown";
import ModelPickerDropdown from "./ModelPickerDropdown";
import type { AgentDef, AgentModel } from "@/lib/agentRegistry";
import { getAgentById } from "@/lib/agentRegistry";

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
  selectedModel?: AgentModel | null;
  onModelSelect?: (model: AgentModel) => void;
  onModelRemove?: () => void;
}

const DEFAULT_PLACEHOLDERS = ["اسأل ميغسي…", "اكتب طلبك هنا…", "ابدأ من أي فكرة…"];

const AnimatedInput = ({
  value,
  onChange,
  onSend,
  onCancel,
  onPlusClick,
  disabled,
  isLoading,
  placeholders,
  pendingQuestions,
  onQuestionAnswer,
  onQuestionSkip,
  activeAgent,
  onAgentSelect,
  mentionCategories,
  selectedModel,
  onModelSelect,
}: AnimatedInputProps) => {
  useDeferredValue(value);
  const items = useMemo(() => (placeholders && placeholders.length > 0 ? placeholders : DEFAULT_PLACEHOLDERS), [placeholders]);
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
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [lastSelectedAgent, setLastSelectedAgent] = useState<AgentDef | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const hasQuestions = !!pendingQuestions?.length;
  const safeQuestionIndex = hasQuestions ? Math.min(questionIndex, pendingQuestions!.length - 1) : 0;
  const currentQuestion = hasQuestions ? pendingQuestions![safeQuestionIndex] : null;

  const activeAgentModels = useMemo(() => {
    if (lastSelectedAgent?.models?.length) return lastSelectedAgent.models;
    if (!activeAgent) return [];
    const agent = getAgentById(activeAgent);
    return agent?.models || [];
  }, [activeAgent, lastSelectedAgent]);

  useEffect(() => {
    if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
    if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);

    if (valueRef.current) {
      setDisplayedPlaceholder("");
      return;
    }

    const target = items[placeholderIndex] || DEFAULT_PLACEHOLDERS[0];
    let charIndex = 0;
    setDisplayedPlaceholder("");

    placeholderIntervalRef.current = setInterval(() => {
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
        }, 2400);
      }
    }, 45);

    return () => {
      if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
      if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
    };
  }, [placeholderIndex, items]);

  useEffect(() => {
    if (value) {
      setDisplayedPlaceholder("");
      if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
      if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
    } else if (!value && !placeholderIntervalRef.current) {
      setPlaceholderIndex((prev) => (prev + 1) % items.length);
    }
  }, [value, items]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const maxH = typeof window !== "undefined" && window.innerWidth < 768 ? 138 : 164;
      el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  useEffect(() => {
    setQuestionIndex(0);
    setQuestionInput("");
  }, [pendingQuestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && (mentionOpen || modelPickerOpen)) {
      setMentionOpen(false);
      setModelPickerOpen(false);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mentionOpen || modelPickerOpen) {
        setMentionOpen(false);
        setModelPickerOpen(false);
        return;
      }
      if (value.trim() && !disabled && !isLoading) onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newVal.slice(0, cursorPos);

    if ((activeAgent || lastSelectedAgent) && activeAgentModels.length > 0) {
      const hashMatch = textBeforeCursor.match(/#(\w*)$/);
      if (hashMatch) {
        setModelPickerOpen(true);
        setModelQuery(hashMatch[1]);
        setMentionOpen(false);
        return;
      }
    }

    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setModelPickerOpen(false);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      if (!textBeforeCursor.match(/#(\w*)$/)) {
        setModelPickerOpen(false);
        setModelQuery("");
      }
    }
  };

  const handleMentionSelect = (agent: AgentDef) => {
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const cleanedBefore = textBeforeCursor.replace(/@\w*$/, "");
    const textAfter = value.slice(cursorPos);
    const agentTag = `@${agent.label} `;
    const newVal = cleanedBefore + agentTag + textAfter;
    onChange(newVal);
    setMentionOpen(false);
    setMentionQuery("");
    setLastSelectedAgent(agent);
    onAgentSelect?.(agent);

    if (agent.models && agent.models.length > 0) {
      setTimeout(() => {
        const pos = (cleanedBefore + agentTag).length;
        void pos;
        onChange(cleanedBefore + agentTag + "#" + textAfter);
        setModelPickerOpen(true);
        setModelQuery("");
      }, 50);
    }
  };

  const handleModelSelect = (model: AgentModel) => {
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const cleanedBefore = textBeforeCursor.replace(/#\w*$/, "");
    const textAfter = value.slice(cursorPos);
    const modelTag = `#${model.label} `;
    onChange(cleanedBefore + modelTag + textAfter);
    setModelPickerOpen(false);
    setModelQuery("");
    onModelSelect?.(model);
  };

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
      <AnimatePresence>
        {mentionOpen && (
          <MentionDropdown
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setMentionOpen(false)}
            visible={mentionOpen}
            categories={mentionCategories}
          />
        )}
        {modelPickerOpen && activeAgentModels.length > 0 && (
          <ModelPickerDropdown
            models={activeAgentModels}
            query={modelQuery}
            onSelect={handleModelSelect}
            onClose={() => setModelPickerOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="milk-input-shell overflow-hidden">
        <AnimatePresence>
          {hasQuestions && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border/60 bg-secondary/30"
            >
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{currentQuestion.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground">{safeQuestionIndex + 1}/{pendingQuestions!.length}</span>
                    <button onClick={onQuestionSkip} className="milk-circle-button h-8 w-8" aria-label="Skip smart question">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((opt, index) => (
                    <button
                      key={`${opt}-${index}`}
                      onClick={() => handleQuestionSelect(opt)}
                      className="rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {currentQuestion.allowText && (
                  <div className="mt-3 flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2">
                    <input
                      type="text"
                      autoComplete="off"
                      dir="auto"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQuestionTextSend();
                        }
                      }}
                      placeholder="اكتب إجابتك…"
                      className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/55"
                    />
                    <button
                      onClick={handleQuestionTextSend}
                      disabled={!questionInput.trim()}
                      className="milk-send-button h-9 w-9 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Send question answer"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-3 px-3 py-3">
          <button onClick={onPlusClick} className="milk-circle-button shrink-0" aria-label="Open attachments">
            <span className="text-[1.9rem] font-light leading-none">+</span>
          </button>

          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={displayedPlaceholder || "اكتب رسالتك…"}
              rows={1}
              className="min-h-[52px] w-full resize-none bg-transparent px-1 py-3 text-[1.02rem] font-medium text-foreground outline-none placeholder:text-muted-foreground/65"
            />
          </div>

          {isLoading ? (
            <button onClick={onCancel} className="milk-send-button shrink-0" aria-label="Stop generation">
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="milk-send-button shrink-0 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedInput;
