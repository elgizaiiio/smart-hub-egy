import { useState, useRef } from "react";
import { Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ThinkingLoader from "./ThinkingLoader";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  images?: string[];
  onLike?: (liked: boolean | null) => void;
  liked?: boolean | null;
}

const ChatMessage = ({ role, content, isStreaming, isThinking, images, onLike, liked }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLongPressStart = () => {
    if (role !== "assistant") return;
    longPressTimer.current = setTimeout(() => setShowActions(true), 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-[0.9375rem] leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="mb-6 relative"
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
    >
      {isThinking && !content ? (
        <ThinkingLoader />
      ) : (
        <>
          <div className="prose-chat text-foreground">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
            )}
          </div>

          {/* Search result images */}
          {images && images.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(img, '_blank')}
                />
              ))}
            </div>
          )}

          {!isStreaming && content && (
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onLike?.(liked === true ? null : true)}
                className={`p-1.5 rounded-lg transition-colors ${liked === true ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onLike?.(liked === false ? null : false)}
                className={`p-1.5 rounded-lg transition-colors ${liked === false ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute left-0 top-0 z-50 glass-panel p-1 flex gap-1">
                <button onClick={() => { handleCopy(); setShowActions(false); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => { onLike?.(true); setShowActions(false); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button onClick={() => { onLike?.(false); setShowActions(false); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatMessage;
