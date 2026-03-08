import { useState, useRef, useCallback } from "react";
import { Copy, ThumbsUp, ThumbsDown, Check, ExternalLink, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ThinkingLoader from "./ThinkingLoader";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  images?: string[];
  attachedImages?: string[];
  onLike?: (liked: boolean | null) => void;
  liked?: boolean | null;
  onShare?: () => void;
}

// Extract domain from URL
const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

// Get favicon for a domain
const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

const ChatMessage = ({ role, content, isStreaming, isThinking, images, attachedImages, onLike, liked, onShare }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");
  }, []);

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%]">
          {attachedImages && attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 justify-end">
              {attachedImages.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl max-h-32 object-cover" />
              ))}
            </div>
          )}
          <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-[0.9375rem] leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Collect all links from the content for the sources section
  const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const links: { text: string; url: string }[] = [];
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    links.push({ text: match[1], url: match[2] });
  }
  // Deduplicate by URL
  const uniqueLinks = links.filter((link, i, arr) => arr.findIndex(l => l.url === link.url) === i);

  return (
    <div className="mb-6 relative">
      {isThinking && !content ? (
        <ThinkingLoader />
      ) : (
        <>
          {/* Search result images ABOVE text */}
          {images && images.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
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

          <div className="prose-chat text-foreground">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    onClick={(e) => href && handleLinkClick(e, href)}
                    className="text-primary underline underline-offset-2 cursor-pointer hover:opacity-80"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
            )}
          </div>

          {/* Professional Sources Section */}
          {!isStreaming && uniqueLinks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Sources</p>
              <div className="flex flex-wrap gap-2">
                {uniqueLinks.slice(0, 6).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    onClick={(e) => handleLinkClick(e, link.url)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/50 transition-colors group max-w-[200px]"
                  >
                    {getFavicon(link.url) && (
                      <img src={getFavicon(link.url)!} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0" />
                    )}
                    <span className="text-[11px] text-muted-foreground truncate">{getDomain(link.url)}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
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
              {onShare && (
                <button
                  onClick={onShare}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
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
