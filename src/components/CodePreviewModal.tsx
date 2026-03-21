import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";

interface CodePreviewModalProps {
  code: string;
  lang: string;
  onClose: () => void;
}

const wrapCodeForPreview = (lang: string, code: string): string => {
  const normalizedLang = lang.toLowerCase();

  if (["html", "htm"].includes(normalizedLang)) {
    return code;
  }

  if (normalizedLang === "css") {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;min-height:100%;background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}${code}</style>
</head><body></body></html>`;
  }

  if (["jsx", "tsx"].includes(normalizedLang)) {
    const presets = normalizedLang === "tsx" ? "typescript,react" : "react";
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body,#root{margin:0;min-height:100%}body{background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head><body>
<div id="root"></div>
<script>
window.addEventListener('error', function(event) {
  document.body.innerHTML = '<pre style="white-space:pre-wrap;padding:20px;color:#fca5a5;font:14px/1.6 system-ui">' + (event.message || 'Preview error') + '</pre>';
});
</script>
<script type="text/babel" data-presets="${presets}">${code}</script>
</body></html>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;min-height:100%}body{background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}</style>
</head><body>
<script>
window.addEventListener('error', function(event) {
  document.body.innerHTML = '<pre style="white-space:pre-wrap;padding:20px;color:#fca5a5;font:14px/1.6 system-ui">' + (event.message || 'Preview error') + '</pre>';
});
</script>
<script>${code}<\/script>
</body></html>`;
};

const CodePreviewModal = ({ code, lang, onClose }: CodePreviewModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDownload = () => {
    const extension = lang.toLowerCase() === "htm" ? "html" : lang.toLowerCase();
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `preview.${extension || "txt"}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const html = wrapCodeForPreview(lang, code);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    if (iframeRef.current) iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code, lang]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-background/85 px-4 py-3 backdrop-blur-2xl">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Live Preview</p>
              <p className="text-xs text-muted-foreground">{lang.toUpperCase()} preview</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex h-10 items-center gap-2 rounded-full bg-secondary/60 px-4 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
            Download code
          </button>
        </div>
        <iframe
          ref={iframeRef}
          key={previewUrl || lang}
          className="flex-1 w-full bg-background"
          sandbox="allow-scripts allow-same-origin allow-downloads"
          title="Code preview"
        />
      </div>
    </motion.div>
  );
};

export default CodePreviewModal;
