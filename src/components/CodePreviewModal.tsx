import { useEffect, useRef, useState } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";

interface CodePreviewModalProps {
  code: string;
  lang: string;
  onClose: () => void;
}

const wrapCodeForPreview = (lang: string, code: string): string => {
  if (["html", "htm"].includes(lang.toLowerCase())) {
    return code;
  }
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fff}</style>
</head><body>
<div id="root"></div>
<script>${code}<\/script>
</body></html>`;
};

const CodePreviewModal = ({ code, lang, onClose }: CodePreviewModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (iframeRef.current) {
      const html = wrapCodeForPreview(lang, code);
      const blob = new Blob([html], { type: "text/html" });
      iframeRef.current.src = URL.createObjectURL(blob);
    }
  }, [code, lang]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-background border border-border rounded-2xl overflow-hidden flex flex-col ${
          isFullscreen ? "w-full h-full" : "w-full max-w-2xl h-[70vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-secondary/30">
          <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          className="flex-1 w-full bg-black"
          sandbox="allow-scripts allow-same-origin"
          title="Code preview"
        />
      </motion.div>
    </motion.div>
  );
};

export default CodePreviewModal;
