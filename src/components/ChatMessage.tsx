import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const ChatMessage = ({ role, content, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);
  const [showActions, setShowActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLongPressStart = () => {
    if (role !== "assistant") return;
    const timer = setTimeout(() => setShowActions(true), 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-secondary text-foreground">
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start relative"
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
    >
      <div className="max-w-[85%]">
        <div className="text-sm text-foreground prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        {/* Action buttons */}
        {!isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setLiked(liked === "up" ? null : "up")}
              className={`p-1.5 rounded-md transition-colors ${
                liked === "up" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title="Like"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLiked(liked === "down" ? null : "down")}
              className={`p-1.5 rounded-md transition-colors ${
                liked === "down" ? "text-destructive bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title="Dislike"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Long press popup */}
      {showActions && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-0 top-full mt-1 z-50 glass-panel p-1 flex items-center gap-0.5"
          >
            <button onClick={() => { handleCopy(); setShowActions(false); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              Copy
            </button>
            <button onClick={() => { setLiked("up"); setShowActions(false); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              Like
            </button>
            <button onClick={() => { setLiked("down"); setShowActions(false); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              Dislike
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default ChatMessage;
