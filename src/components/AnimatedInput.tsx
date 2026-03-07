import { useState, useEffect, useRef } from "react";
import { Plus, ArrowUp, Square } from "lucide-react";

interface AnimatedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onPlusClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholders?: string[];
}

const DEFAULT_PLACEHOLDERS = [
  "What's on your mind?",
  "Ask me anything you want...",
  "Write a poem about the ocean...",
  "Explain how black holes work...",
  "Tell me a joke about programming...",
  "What's the meaning of life?",
  "Help me plan a trip to Japan...",
  "Write a short story about time travel...",
  "Explain quantum physics simply...",
  "Give me a recipe for chocolate cake...",
  "How do I learn a new language fast?",
  "What are the best books to read?",
  "Help me write a professional email...",
  "Explain machine learning to a child...",
  "What happened in history today?",
  "Help me brainstorm startup ideas...",
  "Write a motivational speech...",
  "How does the stock market work?",
  "Create a workout plan for beginners...",
  "What are the wonders of the world?",
  "Help me debug my code...",
  "Write a love letter in Shakespeare style...",
  "Explain the theory of relativity...",
  "Give me tips for better sleep...",
  "What are the best productivity hacks?",
  "Help me write a resume...",
  "Explain cryptocurrency simply...",
  "Write a haiku about autumn...",
  "What are the healthiest foods?",
  "Help me learn chess strategies...",
  "Tell me about ancient civilizations...",
  "How do airplanes stay in the air?",
  "Write a bedtime story for kids...",
  "What are the latest tech trends?",
  "Help me improve my writing skills...",
  "Explain how the internet works...",
  "Give me creative date ideas...",
  "What makes a great leader?",
  "Help me plan a birthday party...",
  "Write lyrics for a pop song...",
  "How do I start meditating?",
  "What are fun weekend activities?",
  "Help me learn photography basics...",
  "Explain climate change simply...",
  "Give me public speaking tips...",
  "What are the best travel destinations?",
  "Help me organize my workspace...",
  "Write a thank you note...",
  "How do I build good habits?",
  "What are interesting science facts?",
  "Help me with math homework...",
  "Tell me about space exploration...",
  "Give me healthy meal prep ideas...",
];

const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading, placeholders }: AnimatedInputProps) => {
  const items = placeholders || DEFAULT_PLACEHOLDERS;
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
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
      <div className="relative flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2">
        <button
          onClick={onPlusClick}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={displayedPlaceholder}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-1.5 max-h-32"
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
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimatedInput;
