import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Download, ThumbsUp, Share2, Send, X, Loader2, ImageIcon, Paperclip, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import OrbLoader from "@/components/OrbLoader";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  attachedImage?: string;
}

const ImageStudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [selectedModel, setSelectedModel] = useState<ModelOption>(() =>
    location.state?.model || getDefaultModel("images")
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (location.state?.prompt) {
      setInput(location.state.prompt);
      setTimeout(() => handleSend(location.state.prompt), 100);
      window.history.replaceState({}, "");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async (promptOverride?: string) => {
    const prompt = promptOverride || input.trim();
    if (!prompt || isGenerating) return;

    const cost = Number(selectedModel.credits) || 1;
    if (userId && !hasEnoughCredits(cost)) { toast.error("Insufficient credits"); return; }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      attachedImage: attachedImage || undefined,
    };
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    const currentAttachedImage = attachedImage;
    setAttachedImage(null);
    setIsGenerating(true);

    const { data: { user } } = await supabase.auth.getUser();
    let convId: string | null = null;
    if (user) {
      const { data } = await supabase.from("conversations").insert({ title: prompt.slice(0, 50), mode: "images", model: selectedModel.id, user_id: user.id } as any).select("id").single();
      convId = data?.id || null;
      if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: prompt });
    }

    try {
      const body: any = {
        prompt,
        model: selectedModel.id,
        user_id: userId,
        credits_cost: cost,
        num_images: 1,
        image_size: { width: 1024, height: 1024 },
      };
      if (currentAttachedImage) body.image_url = currentAttachedImage;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();

      if (data.error) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = `Error: ${data.error}`;
          return copy;
        });
      } else {
        const urls: string[] = data.image_urls || (data.image_url ? [data.image_url] : []);
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = "Here's your generated image";
          copy[copy.length - 1].images = urls;
          return copy;
        });
        if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: prompt, images: urls });
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1].content = "Generation failed. Please try again.";
        return copy;
      });
    }

    setIsGenerating(false);
    refreshCredits();
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a"); a.href = url; a.download = "generated.png"; a.target = "_blank"; a.click();
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-background to-background pointer-events-none" />

        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="images" selectedModelId={selectedModel.id} />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-background/50 backdrop-blur-xl border-b border-border/20">
          <button onClick={() => navigate("/images")} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
          <h1 className="text-sm font-bold text-foreground">Image Studio</h1>
          <div className="w-8" />
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-primary/40" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Create something amazing</h2>
              <p className="text-sm text-muted-foreground">Describe your image or attach a photo to edit</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary/15 rounded-2xl rounded-br-md" : "bg-card/60 backdrop-blur-sm rounded-2xl rounded-bl-md border border-border/20"} p-3`}>
                {/* User attached image */}
                {msg.attachedImage && (
                  <img src={msg.attachedImage} alt="" className="w-32 h-32 object-cover rounded-xl mb-2" />
                )}
                {/* Text */}
                {msg.content && (
                  <div className="text-sm text-foreground">
                    {msg.role === "assistant" ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                )}
                {/* Loading */}
                {msg.role === "assistant" && !msg.content && isGenerating && (
                  <div className="flex items-center justify-center py-8">
                    <OrbLoader />
                  </div>
                )}
                {/* Generated images */}
                {msg.images && msg.images.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.images.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-full rounded-xl" />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => handleDownload(url)} className="p-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-colors">
                            <Download className="w-4 h-4 text-foreground" />
                          </button>
                          <button className="p-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-colors">
                            <ThumbsUp className="w-4 h-4 text-foreground" />
                          </button>
                          <button className="p-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-colors">
                            <Share2 className="w-4 h-4 text-foreground" />
                          </button>
                          <button onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))} className="p-2 rounded-xl bg-primary hover:bg-primary/90 transition-colors">
                            <Send className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Input Bar */}
        <div className="relative z-10 p-3 bg-background/80 backdrop-blur-xl border-t border-border/20">
          {/* Attached image preview */}
          {attachedImage && (
            <div className="mb-2 relative inline-block">
              <img src={attachedImage} alt="" className="w-16 h-16 object-cover rounded-xl" />
              <button onClick={() => setAttachedImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 bg-card/80 rounded-2xl border border-border/30 p-2">
            {/* Model picker button */}
            <button onClick={() => setModelPickerOpen(true)} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
              {selectedModel.iconUrl ? (
                <img src={selectedModel.iconUrl} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">M</div>
              )}
            </button>
            {/* Attach button */}
            <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground">
              <Paperclip className="w-4 h-4" />
            </button>
            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask me anything"
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/50 max-h-24 py-2"
            />
            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedImage) || isGenerating}
              className="shrink-0 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 transition-colors"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
    </AppLayout>
  );
};

export default ImageStudioPage;
