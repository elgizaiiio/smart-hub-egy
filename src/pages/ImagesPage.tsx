import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Square } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import ModelSelector, { getDefaultModel, IMAGE_MODELS } from "@/components/ModelSelector";

const SHOWCASE_IMAGES = [
  "https://e.top4top.io/p_3717n95ku1.jpg",
  "https://f.top4top.io/p_3717d6lc82.jpg",
  "https://g.top4top.io/p_37176ir4i3.jpg",
  "https://h.top4top.io/p_3717ym4ko4.jpg",
  "https://i.top4top.io/p_3717aa6g15.jpg",
  "https://j.top4top.io/p_3717fq0d26.jpg",
  "https://k.top4top.io/p_3717weq7o7.png",
  "https://l.top4top.io/p_3717f9jq98.jpg",
];

const PLACEHOLDERS = [
  "A futuristic city at sunset...",
  "Portrait of a warrior in armor...",
  "Cute cat wearing a tiny hat...",
  "Abstract art with vibrant colors...",
  "Product photo of a luxury watch...",
];

const ImagesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("images"));
  const [currentImage, setCurrentImage] = useState(0);
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % SHOWCASE_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (input) return;
    const target = PLACEHOLDERS[placeholderIdx];
    let charIndex = 0;
    setDisplayedPlaceholder("");
    const typeInterval = setInterval(() => {
      if (charIndex < target.length) {
        setDisplayedPlaceholder(target.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length), 2500);
      }
    }, 50);
    return () => clearInterval(typeInterval);
  }, [placeholderIdx, input]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="images" />

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <ModelSelector mode="images" selectedModel={selectedModel} onModelChange={setSelectedModel} showCategories centerDropdown />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md aspect-[3/4] relative rounded-2xl overflow-hidden mb-6">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={SHOWCASE_IMAGES[currentImage]}
              alt="AI Generated"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {SHOWCASE_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? "bg-white w-4" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Create stunning images</h2>
        <p className="text-sm text-muted-foreground mb-4">Powered by the latest AI models</p>
        {selectedModel.requiresImage && (
          <p className="text-xs text-primary mb-2">This tool requires an image upload</p>
        )}
      </div>

      <div className="shrink-0 px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 backdrop-blur-xl px-3 py-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56"
                >
                  <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Attach Image</span>
                  </button>
                  <div className="border-t border-border mt-1 pt-1">
                    <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Publish to</p>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm">Facebook</button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm">Instagram</button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm">LinkedIn</button>
                  </div>
                </motion.div>
              </>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={displayedPlaceholder + "│"}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
              style={{ minHeight: "32px" }}
            />
            <button
              disabled={!input.trim()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagesPage;
