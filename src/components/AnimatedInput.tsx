import { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, Square } from "lucide-react";

const PLACEHOLDERS = [
  "اكتب أي شيء يخطر ببالك...",
  "اسألني عن أي شيء...",
  "ولّد صورة خيالية...",
  "ابنِ تطبيق ويب كامل...",
  "حلل هذا المستند...",
  "ابحث عن آخر الأخبار...",
  "اشرح لي الذكاء الاصطناعي...",
];

interface AnimatedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onPlusClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading }: AnimatedInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value) return;
    const target = PLACEHOLDERS[placeholderIndex];
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
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 2500);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [placeholderIndex, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
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
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-60 blur-sm pointer-events-none" />

      <div className="relative flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 backdrop-blur-xl px-3 py-2">
        <button
          onClick={onPlusClick}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={displayedPlaceholder + (isTyping && !value ? "│" : "")}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
          style={{ minHeight: "32px" }}
        />

        {isLoading ? (
          <button
            onClick={onCancel}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimatedInput;
