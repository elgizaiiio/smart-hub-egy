import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Pencil, Search, X } from "lucide-react";

interface FilePreviewPanelProps {
  html: string;
  title: string;
  onClose: () => void;
  onEdit: () => void;
  onDownload: (format?: string) => void;
  fullscreen?: boolean;
}

const FilePreviewPanel = ({ html, title, onClose, onEdit, onDownload }: FilePreviewPanelProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 liquid-glass border-b border-border/20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-sm font-medium text-foreground truncate">{title || "Preview"}</p>
        </div>
        <button onClick={() => setSearchOpen(!searchOpen)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in document..." className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" autoFocus />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <div className="flex-1 min-h-0 p-2 md:p-4">
        <div className="w-full h-full rounded-xl overflow-hidden liquid-glass-subtle shadow-lg">
          <iframe srcDoc={html} className="w-full h-full bg-white" sandbox="allow-scripts" title="File Preview" />
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
