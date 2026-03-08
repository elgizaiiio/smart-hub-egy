import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  typing?: boolean;
}

const conversation: { role: "user" | "assistant"; content: string; delay: number }[] = [
  { role: "user", content: "Hello Megsy! What can you do?", delay: 800 },
  { role: "assistant", content: "Hey! I can help you with a lot — send emails, search the web, generate images, write code, analyze files, and much more. Just ask!", delay: 2200 },
  { role: "user", content: "Send an email to my team about the Q1 report", delay: 2000 },
  { role: "assistant", content: "Done! I've drafted and sent the Q1 report summary to your team (marketing@company.com). Subject: \"Q1 2026 Performance Report\". Want me to attach the spreadsheet too?", delay: 2800 },
  { role: "user", content: "Search the web for the latest AI trends in 2026", delay: 2200 },
  { role: "assistant", content: "Here's what I found:\n\n1. Multimodal AI agents are now standard\n2. Video generation hit photorealistic quality\n3. AI coding assistants write 70% of production code\n4. Real-time translation broke language barriers\n\nWant me to create a summary document?", delay: 3200 },
  { role: "user", content: "Generate a logo for my new startup", delay: 1800 },
  { role: "assistant", content: "I'd love to help! Tell me your startup name and style preference (minimal, bold, playful?) and I'll generate options using our image models. You can also switch to Image Generation mode for more control.", delay: 2600 },
];

const ChatDemo = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex >= conversation.length) {
      // Restart after a pause
      const timer = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
      }, 4000);
      return () => clearTimeout(timer);
    }

    const msg = conversation[currentIndex];

    if (msg.role === "assistant") {
      setIsTyping(true);
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: msg.role, content: msg.content }]);
        setCurrentIndex((i) => i + 1);
      }, msg.delay);
      return () => clearTimeout(typingTimer);
    } else {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, { role: msg.role, content: msg.content }]);
        setCurrentIndex((i) => i + 1);
      }, msg.delay);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/20 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-amber-500/60" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">Megsy AI Chat</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted/50 text-foreground border border-border/20 rounded-bl-md"
              }`}
            >
              {msg.content.split("\n").map((line, li) => (
                <span key={li}>
                  {line}
                  {li < msg.content.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border/20 bg-muted/50 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="border-t border-border/20 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-background/50 px-3 py-2">
          <span className="flex-1 text-xs text-muted-foreground/40">Message Megsy...</span>
          <div className="h-6 w-6 rounded-full bg-primary/80 flex items-center justify-center">
            <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;
