import { useState, useCallback, useMemo, useRef, memo } from "react";
import { Copy, ThumbsUp, ThumbsDown, Check, Play, FileUp, Share2, Pencil, Type, Ellipsis } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import ThinkingLoader from "./ThinkingLoader";
import FlowCard from "./FlowCard";
import InfoCards from "./InfoCards";
import CodePreviewModal from "./CodePreviewModal";
import ImagePreviewModal from "./ImagePreviewModal";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageIndex?: number;
  isStreaming?: boolean;
  isThinking?: boolean;
  images?: string[];
  products?: { title: string; price: string; image?: string; link?: string; seller?: string; rating?: string | null; delivery?: string | null }[];
  attachedImages?: string[];
  attachedFiles?: { name: string; type: string }[];
  onLike?: (liked: boolean | null) => void;
  onLikeMessage?: (index: number, liked: boolean | null) => void;
  liked?: boolean | null;
  onShare?: () => void;
  onStructuredAction?: (text: string) => void;
  searchStatus?: string;
  onEditUserMessage?: (text: string) => void;
  onEditUserMessageAt?: (index: number, text: string) => void;
  isDeepResearch?: boolean;
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

const BidiText = ({ children }: { children: React.ReactNode }) => {
  if (typeof children === "string") {
    return <>{wrapEnglishInBdi(children)}</>;
  }
  if (Array.isArray(children)) {
    return <>{children.map((child, i) => typeof child === "string" ? <span key={i}>{wrapEnglishInBdi(child)}</span> : child)}</>;
  }
  return <>{children}</>;
};

const formatRawUrls = (text: string): string => {
  const parts = text.split(/(\[[^\]]*\]\([^)]+\))/g);
  return parts.map(part => {
    if (/^\[[^\]]*\]\([^)]+\)$/.test(part)) return part;
    return part.replace(
      /(?<!\]\()https?:\/\/[^\s<>")\]]+/g,
      (url) => {
        const cleanUrl = url.replace(/[.,;:!?]+$/, '');
        try {
          const domain = new URL(cleanUrl).hostname.replace('www.', '');
          return `[${domain}](${cleanUrl})`;
        } catch {
          return cleanUrl;
        }
      }
    );
  }).join('');
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
              <pre className="p-3 overflow-x-auto text-xs leading-relaxed">
                <code className={className} {...props}>{children}</code>
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
    {formatRawUrls(content)}
  </ReactMarkdown>
);

const ChatMessage = ({ role, content, messageIndex, isStreaming, isThinking, images, products, attachedImages, attachedFiles, onLike, onLikeMessage, liked, onShare, onStructuredAction, searchStatus, onEditUserMessage, onEditUserMessageAt, isDeepResearch }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [previewCode, setPreviewCode] = useState<{ code: string; lang: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied");
  };

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const openMenuAt = useCallback((x: number, y: number) => {
    setMenuPosition({ x, y });
    setMenuOpen(true);
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleUserShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(content);
    toast.success("Message copied for sharing");
  }, [content]);

  const handleSelectText = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Text copied");
  }, [content]);

  const handleLongPressStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (role !== "user") return;
    const touch = e.touches[0];
    longPressRef.current = setTimeout(() => {
      openMenuAt(touch.clientX, touch.clientY - 12);
    }, 450);
  }, [openMenuAt, role]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (role !== "user") return;
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY);
  }, [openMenuAt, role]);

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");
  }, []);

  const handlePreviewCode = useCallback((code: string, lang: string) => {
    setPreviewCode({ code, lang });
  }, []);

  const handleLikeAction = useCallback((nextLiked: boolean | null) => {
    if (typeof messageIndex === "number" && onLikeMessage) {
      onLikeMessage(messageIndex, nextLiked);
      return;
    }
    onLike?.(nextLiked);
  }, [messageIndex, onLike, onLikeMessage]);

  const handleEditAction = useCallback(() => {
    if (typeof messageIndex === "number" && onEditUserMessageAt) {
      onEditUserMessageAt(messageIndex, content);
      return;
    }
    onEditUserMessage?.(content);
  }, [content, messageIndex, onEditUserMessage, onEditUserMessageAt]);

  const structuredBlocks = useMemo(() => {
    if (role === "user" || isStreaming) return null;
    return parseStructuredBlocks(content);
  }, [content, role, isStreaming]);

  const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const links: { text: string; url: string }[] = [];
  let urlMatch;
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    links.push({ text: urlMatch[1], url: urlMatch[2] });
  }
  const uniqueLinks = links.filter((link, i, arr) => arr.findIndex(l => l.url === link.url) === i);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4 relative">
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
          <div
            onContextMenu={handleContextMenu}
            onTouchStart={handleLongPressStart}
            onTouchEnd={clearLongPress}
            onTouchCancel={clearLongPress}
            className="liquid-glass-subtle text-foreground px-4 py-2.5 rounded-[1.6rem] rounded-br-md text-[0.9375rem] leading-relaxed"
          >
            {content}
          </div>

          <AnimatePresence>
            {menuOpen && (
              <>
                <button aria-label="Close" className="fixed inset-0 z-40 cursor-default" onClick={closeMenu} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  className="fixed z-50 overflow-hidden rounded-2xl liquid-glass"
                  style={{ left: `min(${menuPosition.x}px, calc(100vw - 14rem))`, top: `min(${menuPosition.y}px, calc(100vh - 14rem))`, width: "13rem" }}
                >
                  <div className="p-1.5">
                    {[
                      { icon: Copy, label: "Copy", action: async () => { await handleCopy(); closeMenu(); } },
                      { icon: Share2, label: "Share", action: async () => { await handleUserShare(); closeMenu(); } },
                      { icon: Pencil, label: "Edit", action: () => { handleEditAction(); closeMenu(); } },
                      { icon: Type, label: "Select text", action: async () => { await handleSelectText(); closeMenu(); } },
                    ].map(({ icon: Icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent/50 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const hasStructured = structuredBlocks && structuredBlocks.some(b => b.type !== "text");

  return (
    <div className="mb-6 relative">
      {isThinking && !content ? (
        <ThinkingLoader searchStatus={searchStatus} />
      ) : (
        <>
          {images && images.length > 0 && !(products && products.length > 0) && (
            <div className="flex gap-3 mb-3 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory touch-pan-x">
              {images.map((img, i) => (
                <img key={i} src={img} alt="" className="shrink-0 snap-start w-[74vw] max-w-[18rem] aspect-[4/3] rounded-xl border border-border/40 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImageUrl(img)} />
              ))}
            </div>
          )}

          {products && products.length > 0 && (
            <div className="mb-4 flex gap-3 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory touch-pan-x">
              {products.map((product, index) => {
                const card = (
                  <div className="w-[16.5rem] shrink-0 snap-start rounded-2xl liquid-glass-subtle overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="h-36 w-full object-cover" />
                    ) : (
                      <div className="h-36 w-full bg-secondary" />
                    )}
                    <div className="p-3 space-y-1.5">
                      <p className="text-sm font-semibold text-foreground line-clamp-2">{product.title}</p>
                      <p className="text-sm text-primary font-medium">{product.price}</p>
                      {product.seller && <p className="text-xs text-muted-foreground">{product.seller}</p>}
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        {product.rating && <span className="rounded-full bg-background/70 px-2 py-1 border border-border/40">{product.rating}</span>}
                        {product.delivery && <span className="rounded-full bg-background/70 px-2 py-1 border border-border/40">{product.delivery}</span>}
                      </div>
                    </div>
                  </div>
                );

                if (product.link) {
                  return (
                    <a
                      key={`${product.link}-${index}`}
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {card}
                    </a>
                  );
                }

                return <div key={`${product.title}-${index}`}>{card}</div>;
              })}
            </div>
          )}

          {hasStructured && !isStreaming ? (
             <div className="space-y-3">
              {structuredBlocks!.map((block, idx) => {
                if (block.type === "flow") {
                  return <FlowCard key={idx} steps={block.data.steps} onAction={(action, stepTitle) => { onStructuredAction?.(`${action}: ${stepTitle}`); }} />;
                }
                if (block.type === "cards") {
                  return <InfoCards key={idx} items={block.data.items} onAction={(action, title) => { onStructuredAction?.(`${action}: ${title}`); }} />;
                }
                if (block.type === "questions") {
                  return null;
                }
                return (
                  <div key={idx} className="prose-chat text-foreground">
                    <MarkdownRenderer content={typeof block.data === "string" ? block.data : JSON.stringify(block.data)} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="prose-chat text-foreground">
              <MarkdownRenderer content={content} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}

          {/* Sources — hidden for deep research */}
          {!isStreaming && !isDeepResearch && uniqueLinks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {uniqueLinks.slice(0, 8).map((link, i) => (
                  <a key={i} href={link.url} onClick={(e) => handleLinkClick(e, link.url)} className="flex flex-col items-center gap-1 shrink-0 group">
                    <div className="w-8 h-8 rounded-full bg-secondary/60 border border-border/40 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                      {getFavicon(link.url) && <img src={getFavicon(link.url)!} alt="" className="w-4 h-4 rounded-sm" />}
                    </div>
                    <span className="text-[9px] text-muted-foreground max-w-[56px] truncate">{getDomain(link.url)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isStreaming && content && (
            <div className="flex items-center gap-1 mt-2">
              <button onClick={handleCopy} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground liquid-glass-hover transition-all" title="Copy">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <motion.button
                onClick={() => handleLikeAction(liked === true ? null : true)}
                className={`p-1.5 rounded-lg transition-all ${liked === true ? "text-primary" : "text-muted-foreground/50 hover:text-foreground liquid-glass-hover"}`}
                title="Like"
                whileTap={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                onClick={() => handleLikeAction(liked === false ? null : false)}
                className={`p-1.5 rounded-lg transition-all ${liked === false ? "text-destructive" : "text-muted-foreground/50 hover:text-foreground liquid-glass-hover"}`}
                title="Dislike"
                whileTap={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
              {onShare && (
                <button onClick={onShare} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground liquid-glass-hover transition-all" title="More">
                  <Ellipsis className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </>
      )}

      {previewCode && (
        <CodePreviewModal
          code={previewCode.code}
          lang={previewCode.lang}
          onClose={() => setPreviewCode(null)}
        />
      )}

      <ImagePreviewModal
        url={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
};

export default memo(ChatMessage);
