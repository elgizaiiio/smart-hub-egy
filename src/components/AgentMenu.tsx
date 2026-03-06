import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Paperclip, Search } from "lucide-react";
import ModelSelector, { getDefaultModel, type ModelOption } from "./ModelSelector";

interface AgentMenuProps {
  open: boolean;
  onClose: () => void;
  onToggleSearch?: () => void;
  isSearchEnabled?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  mode?: string;
  selectedModel?: ModelOption;
  onModelChange?: (m: ModelOption) => void;
}

const AgentMenu = ({ open, onClose, onToggleSearch, isSearchEnabled, fileInputRef, mode, selectedModel, onModelChange }: AgentMenuProps) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-64"
        >
          <div className="space-y-0.5">
            {/* Model selector */}
            {selectedModel && onModelChange && (
              <div className="px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase mb-2">Model</p>
                <ModelSelector
                  mode={(mode as any) || "chat"}
                  selectedModel={selectedModel}
                  onModelChange={(m) => { onModelChange(m); }}
                  showCategories={mode === "images" || mode === "videos"}
                />
              </div>
            )}

            {/* Web search toggle */}
            {onToggleSearch && (
              <button
                onClick={() => { onToggleSearch(); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isSearchEnabled ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                }`}
              >
                <Globe className="w-4 h-4" />
                <div>
                  <p className="text-sm">Web Search</p>
                  <p className="text-[10px] text-muted-foreground">{isSearchEnabled ? "Enabled" : "Search the web for answers"}</p>
                </div>
              </button>
            )}

            {/* Attach file */}
            <button
              onClick={() => { fileInputRef.current?.click(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
            >
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">Attach File</p>
                <p className="text-[10px] text-muted-foreground">Upload images or documents</p>
              </div>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AgentMenu;
