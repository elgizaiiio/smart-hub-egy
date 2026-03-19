import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";

interface SmartQuestion {
  title: string;
  options: string[];
  allowText?: boolean;
  multiSelect?: boolean;
}

interface SmartQuestionCardProps {
  questions: SmartQuestion[];
  onAnswer: (answer: string) => void;
  answered?: boolean;
}

const SmartQuestionCard = ({ questions, onAnswer, answered }: SmartQuestionCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());

  if (answered) {
    return (
      <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
        {answers.length > 0 ? answers.join(" / ") : "Answered"}
      </div>
    );
  }

  const q = questions[currentIndex];
  if (!q) return null;

  const handleSelect = (option: string) => {
    if (q.multiSelect) {
      setSelectedMulti(prev => {
        const next = new Set(prev);
        if (next.has(option)) next.delete(option); else next.add(option);
        return next;
      });
      return;
    }
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onAnswer(newAnswers.join("\n"));
    }
  };

  const handleMultiSubmit = () => {
    if (selectedMulti.size === 0) return;
    const combined = Array.from(selectedMulti).join(", ");
    const newAnswers = [...answers, combined];
    setAnswers(newAnswers);
    setSelectedMulti(new Set());
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onAnswer(newAnswers.join("\n"));
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    handleSelect(textInput.trim());
    setTextInput("");
  };

  const handleSkip = () => {
    onAnswer("Skip and assume the best");
  };

  const total = questions.length;
  const current = currentIndex + 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl border border-border/50 bg-secondary/30 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
          <p className="text-sm font-semibold text-foreground">{q.title}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{current}/{total}</span>
            <button onClick={handleSkip} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Skip</button>
          </div>
        </div>

        {/* Options */}
        <div className="p-2 space-y-1">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                q.multiSelect && selectedMulti.has(opt)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary/60"
              }`}
            >
              {q.multiSelect ? (
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedMulti.has(opt) ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {selectedMulti.has(opt) && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ) : (
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">{i + 1}</span>
              )}
              <span className="text-sm text-foreground">{opt}</span>
            </button>
          ))}
        </div>

        {/* Text input */}
        {q.allowText !== false && (
          <div className="flex items-center gap-2 px-3 pb-3">
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
              placeholder="Type your own answer..."
              className="flex-1 px-3 py-2 rounded-lg bg-secondary/40 text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
            />
            {textInput.trim() && (
              <button
                onClick={handleTextSubmit}
                className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Send className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Multi-select submit */}
        {q.multiSelect && selectedMulti.size > 0 && (
          <div className="px-3 pb-3">
            <button
              onClick={handleMultiSubmit}
              className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartQuestionCard;
