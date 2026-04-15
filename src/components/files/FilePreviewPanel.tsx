import { motion } from "framer-motion";
import { ArrowLeft, Download, Pencil } from "lucide-react";

interface FilePreviewPanelProps {
  html: string;
  title: string;
  onClose: () => void;
  onEdit: () => void;
  onDownload: (format?: string) => void;
  fullscreen?: boolean;
}

const FilePreviewPanel = ({ html, title, onClose, onEdit, onDownload }: FilePreviewPanelProps) => {
  // Inject viewport meta + responsive CSS into the iframe content
  const responsiveHtml = html.replace(
    /<head([^>]*)>/i,
    `<head$1><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"><style>*{box-sizing:border-box}body{overflow-x:hidden;max-width:100vw}img{max-width:100%;height:auto}table{max-width:100%;overflow-x:auto;display:block}</style>`
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-medium text-foreground truncate">{title || "Preview"}</p>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0">
        <div className="w-full h-full overflow-hidden">
          <iframe srcDoc={responsiveHtml} className="w-full h-full bg-white" sandbox="allow-scripts" title="File Preview" />
        </div>
      </div>

      {/* Floating buttons */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 z-10">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onEdit} className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-foreground shadow-lg hover:scale-105 transition-transform">
          <Pencil className="w-5 h-5" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDownload()} className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <Download className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default FilePreviewPanel;
