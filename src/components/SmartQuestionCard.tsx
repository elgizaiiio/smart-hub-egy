import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";

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
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-x-0 bottom-0 z-50 md:relative md:inset-auto md:z-auto"
      >
        {/* Backdrop for mobile */}
        <div className="md:hidden fixed inset-0 bg-black/40 -z-10" onClick={handleSkip} />

        <div className="bg-card border-t border-border md:border md:rounded-xl md:shadow-lg p-4 md:p-5 space-y-4 md:max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button onClick={handleSkip} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground">{current} of {total}</span>
          </div>

          {/* Question title */}
          <p className="text-base font-semibold text-foreground text-right md:text-left">{q.title}</p>

          {/* Options */}
          <div className="space-y-0">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-border/40 last:border-b-0 transition-colors text-right md:text-left ${
                  q.multiSelect && selectedMulti.has(opt)
                    ? "bg-primary/10"
                    : "hover:bg-secondary/40"
                }`}
              >
                <span className="text-sm font-medium text-foreground flex-1">{opt}</span>
                {q.multiSelect ? (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
                    selectedMulti.has(opt) ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {selectedMulti.has(opt) && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 ml-3">{i + 1}</span>
                )}
              </button>
            ))}
          </div>

          {/* Text input */}
          {q.allowText !== false && (
            <div className="flex items-center gap-2 border-t border-border/40 pt-3">
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                placeholder="Type your own answer..."
                className="flex-1 px-3 py-2.5 rounded-lg bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
              />
              {textInput.trim() && (
                <button
                  onClick={handleTextSubmit}
                  className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Multi-select submit */}
          {q.multiSelect && selectedMulti.size > 0 && (
            <button
              onClick={handleMultiSubmit}
              className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartQuestionCard;
