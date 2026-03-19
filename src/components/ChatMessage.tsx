import { useState, useRef, useCallback, useMemo } from "react";
import { Copy, ThumbsUp, ThumbsDown, Check, FileUp } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThinkingLoader from "./ThinkingLoader";
import SmartQuestionCard from "./SmartQuestionCard";
import FlowCard from "./FlowCard";
import InfoCards from "./InfoCards";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  images?: string[];
  attachedImages?: string[];
  attachedFiles?: { name: string; type: string }[];
  onLike?: (liked: boolean | null) => void;
  liked?: boolean | null;
  onShare?: () => void;
  onStructuredAction?: (text: string) => void;
}

const getDomain = (url: string) => {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
};

const getFavicon = (url: string) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return null; }
};

function parseStructuredBlocks(content: string): { type: "text" | "questions" | "flow" | "cards"; data: any; raw: string }[] {
  const blocks: { type: "text" | "questions" | "flow" | "cards"; data: any; raw: string }[] = [];
  const jsonBlockRegex = /```json\s*\n?([\s\S]*?)\n?```/g;
  let lastIndex = 0;
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) blocks.push({ type: "text", data: textBefore, raw: textBefore });
    }
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type === "questions" && parsed.questions) {
        blocks.push({ type: "questions", data: parsed, raw: match[0] });
      } else if (parsed.type === "flow" && parsed.steps) {
        blocks.push({ type: "flow", data: parsed, raw: match[0] });
      } else if (parsed.type === "cards" && parsed.items) {
        blocks.push({ type: "cards", data: parsed, raw: match[0] });
      } else {
        blocks.push({ type: "text", data: match[0], raw: match[0] });
      }
    } catch {
      blocks.push({ type: "text", data: match[0], raw: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) blocks.push({ type: "text", data: remaining, raw: remaining });
  }

  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: "text", data: content, raw: content });
  }

  return blocks;
}

const MarkdownContent = ({ content, onLinkClick }: { content: string; onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ href, children }) => (
        <a href={href} onClick={(e) => href && onLinkClick(e, href)} className="text-primary underline underline-offset-2 cursor-pointer hover:opacity-80">
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-3 rounded-lg border border-border">
          <table className="w-full text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-muted/50 border-b border-border">{children}</thead>,
      th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2 text-xs text-muted-foreground border-t border-border/50">{children}</td>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const ChatMessage = ({ role, content, isStreaming, isThinking, images, attachedImages, attachedFiles, onLike, liked, onStructuredAction }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");
  }, []);

  const structuredBlocks = useMemo(() => {
    if (role === "user" || isStreaming) return null;
    return parseStructuredBlocks(content);
  }, [content, role, isStreaming]);

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%]">
          {attachedImages && attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 justify-end flex-wrap">
              {attachedImages.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl max-h-32 max-w-[120px] object-cover" />
              ))}
            </div>
          )}
          {attachedFiles && attachedFiles.length > 0 && (
            <div className="flex gap-2 mb-2 justify-end flex-wrap">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-xs text-foreground border border-border">
                  <FileUp className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate max-w-[100px]">{f.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="bg-secondary text-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-[0.9375rem] leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    );
  }

  const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const links: { text: string; url: string }[] = [];
  let urlMatch;
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    links.push({ text: urlMatch[1], url: urlMatch[2] });
  }
  const uniqueLinks = links.filter((link, i, arr) => arr.findIndex(l => l.url === link.url) === i);

  const hasStructured = structuredBlocks && structuredBlocks.some(b => b.type !== "text");

  return (
    <div className="mb-6 relative">
      {isThinking && !content ? (
        <ThinkingLoader />
      ) : (
        <>
          {images && images.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(img, '_blank')} />
              ))}
            </div>
          )}

          {hasStructured && !isStreaming ? (
            <div className="space-y-3">
              {structuredBlocks!.map((block, idx) => {
                if (block.type === "questions") {
                  return (
                    <SmartQuestionCard
                      key={idx}
                      questions={block.data.questions}
                      onAnswer={(answer) => {
                        setAnsweredQuestions(prev => new Set(prev).add(idx));
                        onStructuredAction?.(answer);
                      }}
                      answered={answeredQuestions.has(idx)}
                    />
                  );
                }
                if (block.type === "flow") {
                  return <FlowCard key={idx} steps={block.data.steps} onAction={(action, stepTitle) => onStructuredAction?.(`${action}: ${stepTitle}`)} />;
                }
                if (block.type === "cards") {
                  return <InfoCards key={idx} items={block.data.items} onAction={(action, title) => onStructuredAction?.(`${action}: ${title}`)} />;
                }
                return (
                  <div key={idx} className="prose-chat text-foreground">
                    <MarkdownContent content={block.data} onLinkClick={handleLinkClick} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="prose-chat text-foreground">
              <MarkdownContent content={content} onLinkClick={handleLinkClick} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}

          {/* Sources - inline favicon style */}
          {!isStreaming && uniqueLinks.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              {uniqueLinks.slice(0, 6).map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  onClick={(e) => handleLinkClick(e, link.url)}
                  className="w-7 h-7 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  title={getDomain(link.url)}
                >
                  {getFavicon(link.url) && <img src={getFavicon(link.url)!} alt="" className="w-4 h-4 rounded-sm" />}
                </a>
              ))}
              <span className="text-xs text-muted-foreground ml-1">Sources</span>
            </div>
          )}

          {/* Action buttons */}
          {!isStreaming && content && (
            <div className="flex items-center gap-0.5 mt-2">
              <button onClick={handleCopy} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all active:scale-90 duration-150" title="Copy">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <motion.button
                onClick={() => onLike?.(liked === true ? null : true)}
                className={`p-1.5 rounded-lg transition-all duration-150 ${liked === true ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-foreground hover:bg-accent"}`}
                title="Like"
                whileTap={{ scale: 1.4 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <ThumbsUp className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => onLike?.(liked === false ? null : false)}
                className={`p-1.5 rounded-lg transition-all duration-150 ${liked === false ? "text-destructive bg-destructive/10" : "text-muted-foreground/50 hover:text-foreground hover:bg-accent"}`}
                title="Dislike"
                whileTap={{ scale: 1.4 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <ThumbsDown className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatMessage;
