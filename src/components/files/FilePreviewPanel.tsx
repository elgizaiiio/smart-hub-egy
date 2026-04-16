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

const spring = { type: "spring" as const, damping: 22, stiffness: 350 };

const FilePreviewPanel = ({ html, title, onClose, onEdit, onDownload }: FilePreviewPanelProps) => {
  const responsiveHtml = html.replace(
    /<head([^>]*)>/i,
    `<head$1><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><style>*{box-sizing:border-box}html,body{margin:0;padding:0;overflow-x:hidden;max-width:100vw;width:100%}img{max-width:100%;height:auto}table{max-width:100%;display:block;overflow-x:auto}pre{overflow-x:auto;max-width:100%}</style>`
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className="flex flex-col h-full relative"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <motion.button
          whileTap={{ scale: 0.85 }}
          transition={spring}
          onClick={onClose}
          className="w-10 h-10 rounded-[14px] liquid-glass-card flex items-center justify-center text-muted-foreground hover:text-foreground ios-spring-press"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <p className="text-sm font-semibold text-foreground truncate flex-1">{title || "Preview"}</p>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 mx-3 mb-3 rounded-[22px] overflow-hidden border border-border/15 shadow-lg">
        <iframe
          srcDoc={responsiveHtml}
          className="w-full h-full bg-white"
          sandbox="allow-scripts"
          title="File Preview"
        />
      </div>

      {/* Floating buttons */}
      <div className="absolute bottom-8 right-6 flex items-center gap-3 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={spring}
          onClick={onEdit}
          className="w-12 h-12 rounded-full liquid-glass-milk flex items-center justify-center text-foreground ios-spring-press"
        >
          <Pencil className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={spring}
          onClick={() => onDownload()}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 ios-spring-press"
        >
          <Download className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FilePreviewPanel;
