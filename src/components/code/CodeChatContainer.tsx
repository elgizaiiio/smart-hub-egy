import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import CodeStepMessage, { CodeStep } from "./CodeStepMessage";

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "plan" | "build" | "log" | "status" | "timeline" | "steps";
}

interface Props {
  messages: ChatMsg[];
  steps: CodeStep[];
  activeStepId: string | null;
  isThinking: boolean;
}

const VISIBLE_LIMIT = 30;

const CodeChatContainer = ({ messages, steps, activeStepId, isThinking }: Props) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps]);

  const visibleMessages = messages.slice(-VISIBLE_LIMIT);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full space-y-3">
      <AnimatePresence mode="popLayout">
        {visibleMessages.map((msg, i) => (
          <motion.div
            key={`msg-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={msg.role === "user" ? "flex justify-end" : ""}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm" dir="auto">
                {msg.content}
              </div>
            ) : msg.type === "steps" ? null : (
              <div className="text-foreground text-sm prose-chat" dir="auto">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Steps rendered inline */}
      {steps.length > 0 && (
        <div className="space-y-0.5">
          {steps.map(step => (
            <CodeStepMessage
              key={step.id}
              step={step}
              isActive={step.id === activeStepId}
            />
          ))}
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

export default CodeChatContainer;
