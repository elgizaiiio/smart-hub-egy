import { useState, useCallback, useMemo, useRef } from "react";
import { Copy, Heart, CircleOff, Check, Play, FileUp } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThinkingLoader from "./ThinkingLoader";
import FlowCard from "./FlowCard";
import InfoCards from "./InfoCards";
import CodePreviewModal from "./CodePreviewModal";
import { useAppLanguage } from "@/hooks/useAppLanguage";

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
  searchQuery?: string;
  createdAt?: string;
  onUserLongPress?: (rect: DOMRect) => void;
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

const isPreviewableCode = (lang: string | undefined, code: string): boolean => {
  if (!lang) return false;
  const previewableLangs = ["html", "htm", "jsx", "tsx", "javascript", "js"];
  return previewableLangs.includes(lang.toLowerCase());
};

const wrapCodeForPreview = (lang: string, code: string): string => {
  if (["html", "htm"].includes(lang.toLowerCase())) {
    return code;
  }
  // For JS/JSX/TSX, wrap in a basic HTML page
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111}</style>
</head><body>
<div id="root"></div>
<script>${code}</script>
</body></html>`;
};

const wrapEnglishInBdi = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  const regex = /[A-Za-z0-9_./:\-]+/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<bdi key={match.index}>{match[0]}</bdi>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
};

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const highlightCodeHtml = (code: string, lang?: string) => {
  const normalizedLang = lang?.toLowerCase() || "";
  const tokens: string[] = [];

  const reserveToken = (value: string, className: string) => {
    const tokenId = tokens.length;
    tokens.push(`<span class="${className}">${escapeHtml(value)}</span>`);
    return `@@TOKEN_${tokenId}@@`;
  };

  let working = code;
  const apply = (regex: RegExp, className: string) => {
    working = working.replace(regex, (match) => reserveToken(match, className));
  };

  apply(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->/g, "token-comment");
  apply(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "token-string");

  if (["html", "htm", "xml", "svg"].includes(normalizedLang)) {
    apply(/<\/?[A-Za-z][^>]*?>/g, "token-tag");
  } else {
    apply(/\b(function|const|let|var|return|if|else|for|while|switch|case|break|continue|try|catch|finally|async|await|class|new|import|export|from|default|extends|implements|interface|type|public|private|protected|true|false|null|undefined|throw)\b/g, "token-keyword");
    apply(/\b\d+(?:\.\d+)?\b/g, "token-number");
    apply(/\b([A-Za-z_$][\w$]*)(?=\s*\()/g, "token-function");
  }

  return working.replace(/@@TOKEN_(\d+)@@/g, (_, id) => tokens[Number(id)] || "");
};

const BidiText = ({ children }: { children: React.ReactNode }) => {
  if (typeof children === "string") {
    return <>{wrapEnglishInBdi(children)}</>;
  }
  if (Array.isArray(children)) {
    return <>{children.map((child, i) => typeof child === "string" ? <span key={i}>{wrapEnglishInBdi(child)}</span> : child)}</>;
  }
  return <>{children}</>;
};

const MarkdownRenderer = ({ content, onLinkClick, onPreviewCode }: { 
  content: string; 
  onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onPreviewCode?: (code: string, lang: string) => void;
}) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p><BidiText>{children}</BidiText></p>,
      li: ({ children }) => <li><BidiText>{children}</BidiText></li>,
      strong: ({ children }) => <strong><BidiText>{children}</BidiText></strong>,
      em: ({ children }) => <em><BidiText>{children}</BidiText></em>,
      a: ({ href, children }) => (
        <a href={href} onClick={(e) => href && onLinkClick(e, href)} className="text-primary underline underline-offset-2 cursor-pointer hover:opacity-80">
          {children}
        </a>
      ),
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || "");
        const lang = match ? match[1] : undefined;
        const codeStr = String(children).replace(/\n$/, "");
        const isBlock = className?.startsWith("language-");
        
        if (isBlock && lang) {
          const canPreview = isPreviewableCode(lang, codeStr);
          const highlighted = highlightCodeHtml(codeStr, lang);
          return (
            <div className="relative my-3 rounded-xl overflow-hidden border border-border/40 bg-secondary/30">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-secondary/50">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{lang}</span>
                <div className="flex items-center gap-1">
                  {canPreview && onPreviewCode && (
                    <button
                      onClick={() => onPreviewCode(codeStr, lang)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Preview
                    </button>
                  )}
                </div>
              </div>
              <pre className="code-highlight p-3 overflow-x-auto text-xs leading-relaxed selectable">
                <code className={className} dangerouslySetInnerHTML={{ __html: highlighted }} {...props} />
              </pre>
            </div>
          );
        }
        
        return <code className="px-1 py-0.5 rounded bg-secondary/50 text-xs font-mono" {...props}>{children}</code>;
      },
      pre: ({ children }) => <>{children}</>,
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

const ChatMessage = ({ role, content, isStreaming, isThinking, images, attachedImages, attachedFiles, onLike, liked, onStructuredAction, searchQuery, createdAt, onUserLongPress }: ChatMessageProps) => {
  const { isArabic } = useAppLanguage();
  const [copied, setCopied] = useState(false);
  const [previewCode, setPreviewCode] = useState<{ code: string; lang: string } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      const rect = bubbleRef.current?.getBoundingClientRect();
      if (rect) onUserLongPress?.(rect);
      clearLongPress();
    }, 760);
  }, [clearLongPress, onUserLongPress]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssistantTapCopy = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, pre, code, img, table")) return;
    if (window.getSelection?.()?.toString()) return;
    handleCopy();
  };

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");
  }, []);

  const handlePreviewCode = useCallback((code: string, lang: string) => {
    setPreviewCode({ code, lang });
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
          <motion.div
            ref={bubbleRef}
            whileTap={{ scale: 0.985 }}
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = bubbleRef.current?.getBoundingClientRect();
              if (rect) onUserLongPress?.(rect);
            }}
            onTouchStart={startLongPress}
            onTouchEnd={clearLongPress}
            onTouchCancel={clearLongPress}
            onMouseDown={startLongPress}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            dir="auto"
            className="unlock-message-user selectable text-foreground px-4 py-3 rounded-[1.35rem] rounded-br-md text-[0.95rem] leading-8 transition-transform duration-200"
          >
            {content}
          </motion.div>
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
    <div className="mb-6 relative flex justify-start">
      <div className="max-w-[92%]">
      {isThinking && !content ? (
        <ThinkingLoader searchQuery={searchQuery} />
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
                if (block.type === "flow") {
                  return (
                    <FlowCard
                      key={idx}
                      steps={block.data.steps}
                      onAction={(action, stepTitle) => {
                        onStructuredAction?.(`${action}: ${stepTitle}`);
                      }}
                    />
                  );
                }
                if (block.type === "cards") {
                  return (
                    <InfoCards
                      key={idx}
                      items={block.data.items}
                      onAction={(action, title) => {
                        onStructuredAction?.(`${action}: ${title}`);
                      }}
                    />
                  );
                }
                if (block.type === "questions") {
                  return null;
                }
                return (
                  <div key={idx} className="unlock-message-assistant prose-chat text-foreground rounded-[1.6rem] px-4 py-3" dir="auto" onClick={handleAssistantTapCopy}>
                    <MarkdownRenderer content={typeof block.data === "string" ? block.data : JSON.stringify(block.data)} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="unlock-message-assistant prose-chat selectable text-foreground rounded-[1.6rem] px-4 py-3 cursor-copy" dir="auto" onClick={handleAssistantTapCopy}>
              <MarkdownRenderer content={content} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}

          {/* Sources - Inline favicons */}
          {!isStreaming && uniqueLinks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {uniqueLinks.slice(0, 8).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    onClick={(e) => handleLinkClick(e, link.url)}
                    className="flex flex-col items-center gap-1 shrink-0 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/60 border border-border/40 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                      {getFavicon(link.url) && (
                        <img src={getFavicon(link.url)!} alt="" className="w-4 h-4 rounded-sm" />
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground max-w-[56px] truncate">{getDomain(link.url)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isStreaming && content && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <motion.button
                onClick={() => onLike?.(liked === true ? null : true)}
                className={`unlock-action-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${liked === true ? "border-primary/30 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title={isArabic ? "أعجبني" : "Like"}
                whileTap={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Heart className="w-4 h-4" />
                <span>{isArabic ? "أعجبني" : "Like"}</span>
              </motion.button>
              <motion.button
                onClick={() => onLike?.(liked === false ? null : false)}
                className={`unlock-action-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${liked === false ? "border-destructive/30 text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                title={isArabic ? "لم يعجبني" : "Dislike"}
                whileTap={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <CircleOff className="w-4 h-4" />
                <span>{isArabic ? "لم يعجبني" : "Dislike"}</span>
              </motion.button>
              <button onClick={handleCopy} className="unlock-action-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 duration-150" title={isArabic ? "نسخ" : "Copy"}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? (isArabic ? "تم النسخ" : "Copied") : (isArabic ? "نسخ" : "Copy")}</span>
              </motion.button>
            </div>
          )}
        </>
      )}
      </div>

      {/* Code Preview Modal */}
      {previewCode && (
        <CodePreviewModal
          code={previewCode.code}
          lang={previewCode.lang}
          onClose={() => setPreviewCode(null)}
        />
      )}
    </div>
  );
};

export default ChatMessage;
