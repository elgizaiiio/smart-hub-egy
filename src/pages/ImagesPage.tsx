import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import ModelSelector, { getDefaultModel } from "@/components/ModelSelector";
import ThinkingLoader from "@/components/ThinkingLoader";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const SHOWCASE_IMAGES = [
  "https://e.top4top.io/p_3717n95ku1.jpg",
  "https://f.top4top.io/p_3717d6lc82.jpg",
  "https://g.top4top.io/p_37176ir4i3.jpg",
  "https://h.top4top.io/p_3717ym4ko4.jpg",
  "https://i.top4top.io/p_3717aa6g15.jpg",
  "https://j.top4top.io/p_3717fq0d26.jpg",
];

const PLACEHOLDERS = [
  "A futuristic city at sunset...",
  "Portrait of a warrior in armor...",
  "Cute cat wearing a tiny hat...",
  "Abstract art with vibrant colors...",
];

const ImagesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("images"));
  const [currentImage, setCurrentImage] = useState(0);
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentImage(p => (p + 1) % SHOWCASE_IMAGES.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (input) return;
    const target = PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (i < target.length) { setDisplayedPlaceholder(target.slice(0, i + 1)); i++; }
      else { clearInterval(t); setTimeout(() => setPlaceholderIdx(p => (p + 1) % PLACEHOLDERS.length), 2500); }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx, input]);

  const handleGenerate = async () => {
    if (!input.trim() && !attachedImage) return;
    if (selectedModel.requiresImage && !attachedImage) {
      toast.error("This model requires an image upload");
      return;
    }

    const userMsg: ChatMsg = { role: "user", content: input || "Generate image" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: userMsg.content,
          model: selectedModel.id,
          image_url: attachedImage || undefined,
        }),
      });
      const data = await resp.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      } else if (data.image_url) {
        setMessages(prev => [...prev, { role: "assistant", content: "Here's your generated image:", imageUrl: data.image_url }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "No image was returned. Please try again." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Generation failed. Please try again." }]);
    }
    setIsGenerating(false);
    setAttachedImage(null);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setMessages([]); setInput(""); }} currentMode="images" />

      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <ModelSelector mode="images" selectedModel={selectedModel} onModelChange={setSelectedModel} showCategories />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-full max-w-xs aspect-[3/4] max-h-[50vh] relative rounded-2xl overflow-hidden mb-4">
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
                  <button key={i} onClick={() => setCurrentImage(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? "bg-white w-4" : "bg-white/40"}`} />
                ))}
              </div>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Create stunning images</h2>
            <p className="text-xs text-muted-foreground mb-4">Powered by the latest AI models</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 px-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex justify-end mb-4">
                    <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-foreground mb-2">{msg.content}</p>
                    {msg.imageUrl && (
                      <div className="relative group">
                        <img src={msg.imageUrl} alt="Generated" className="w-full max-w-md rounded-2xl" />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => window.open(msg.imageUrl, "_blank")} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isGenerating && <ThinkingLoader />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3 pt-1">
        <div className="max-w-3xl mx-auto">
          {attachedImage && (
            <div className="flex items-center gap-2 px-3 pb-2">
              <img src={attachedImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-xs text-muted-foreground">Image attached</span>
              <button onClick={() => setAttachedImage(null)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">×</button>
            </div>
          )}
          <div className="relative flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 backdrop-blur-xl px-3 py-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56">
                    <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Attach Image</span>
                    </button>
                    <div className="border-t border-border mt-1 pt-1">
                      <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Publish to</p>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
                        <FacebookIcon /> Facebook
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
                        <InstagramIcon /> Instagram
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground">
                        <LinkedInIcon /> LinkedIn
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={displayedPlaceholder + "│"}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
              style={{ minHeight: "32px" }}
            />
            <button
              onClick={handleGenerate}
              disabled={(!input.trim() && !attachedImage) || isGenerating}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} />
        </div>
      </div>
    </div>
  );
};

export default ImagesPage;
