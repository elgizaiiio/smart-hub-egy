import { useState } from "react";
import { motion } from "framer-motion";

interface SmartQuestion {
  title: string;
  options: string[];
  allowText?: boolean;
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
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">{q.title}</p>
      <div className="flex flex-wrap gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            className="px-3.5 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground hover:bg-accent/50 hover:border-primary/30 transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
      {q.allowText !== false && (
        <div className="flex gap-2">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
            placeholder="Or type your answer..."
            className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground outline-none focus:border-primary/40 transition-colors"
          />
          {textInput.trim() && (
            <button
              onClick={handleTextSubmit}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          )}
        </div>
      )}
      <button
        onClick={handleSkip}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip and assume the best
      </button>
    </motion.div>
  );
};

export default SmartQuestionCard;
