import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import ModelSelector, { getDefaultModel, VIDEO_MODELS } from "@/components/ModelSelector";

const SHOWCASE_VIDEOS = [
  "https://c.top4top.io/m_3717ii9uw1.mp4",
  "https://d.top4top.io/m_37171b7u82.mp4",
  "https://e.top4top.io/m_3717vzbe63.mp4",
  "https://f.top4top.io/m_37170afbw4.mp4",
  "https://g.top4top.io/m_37175kxz05.mp4",
  "https://h.top4top.io/m_3717167856.mp4",
  "https://i.top4top.io/m_3717w2for7.mp4",
];

const PLACEHOLDERS = [
  "A cinematic drone shot of mountains...",
  "Person walking through neon streets...",
  "Time-lapse of a flower blooming...",
  "Slow motion water splash...",
];

const VideosPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("videos"));
  const [currentVideo, setCurrentVideo] = useState(0);
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo(prev => (prev + 1) % SHOWCASE_VIDEOS.length);
    }, 8000);
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
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} />

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <ModelSelector mode="videos" selectedModel={selectedModel} onModelChange={setSelectedModel} showCategories />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md aspect-[9/16] max-h-[60vh] relative rounded-2xl overflow-hidden mb-6 bg-secondary">
          <AnimatePresence mode="wait">
            <motion.video
              key={currentVideo}
              ref={videoRef}
              src={SHOWCASE_VIDEOS[currentVideo]}
              autoPlay
              muted
              loop
              playsInline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {SHOWCASE_VIDEOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentVideo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentVideo ? "bg-white w-4" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Create amazing videos</h2>
        <p className="text-sm text-muted-foreground mb-4">From text to video with AI</p>
        {selectedModel.requiresImage && (
          <p className="text-xs text-primary mb-2">This model requires an image input</p>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56">
                  <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Attach Image/Video</span>
                  </button>
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
            <button disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideosPage;
