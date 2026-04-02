import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Download, ThumbsUp, Share2, ArrowLeft, X, Loader2, Paperclip } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import OrbLoader from "@/components/OrbLoader";
import studioHero from "@/assets/studio-videos-hero.jpg";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  videos?: string[];
  attachedImage?: string;
}

const STUDIO_PLACEHOLDERS = [
  "A cinematic drone shot over mountains...",
  "Slow motion water splash in 4K...",
  "Anime action scene with effects...",
  "Describe your video idea...",
];

const HERO_TEXTS = [
  { main: "Stories", accent: "in motion" },
  { main: "Create", accent: "cinematic magic" },
  { main: "Your vision", accent: "animated" },
];

const VideoStudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [selectedModel, setSelectedModel] = useState<ModelOption>(() =>
    location.state?.model || getDefaultModel("videos")
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadExistingConversation(); }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (location.state?.prompt) {
      setInput(location.state.prompt);
      setTimeout(() => handleSend(location.state.prompt), 200);
      window.history.replaceState({}, "");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % STUDIO_PLACEHOLDERS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setHeroIdx(i => (i + 1) % HERO_TEXTS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const loadExistingConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "videos").order("updated_at", { ascending: false }).limit(1);
    if (convs && convs.length > 0) {
      const convId = convs[0].id;
      setConversationId(convId);
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          videos: (m.images || []).filter((u: string) => u.includes(".mp4") || u.includes("video")),
        })));
      }
    }
  };

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
    setAttachedImage(null);
    setIsGenerating(true);

    const { data: { user } } = await supabase.auth.getUser();
    let convId = conversationId;
    if (user && !convId) {
      const { data } = await supabase.from("conversations").insert({ title: prompt.slice(0, 50), mode: "videos", model: selectedModel.id, user_id: user.id } as any).select("id").single();
      convId = data?.id || null;
      setConversationId(convId);
    }
    if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: prompt });

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt, model: selectedModel.id, user_id: userId, credits_cost: cost }),
      });
      const data = await resp.json();

      if (data.error) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = `Error: ${data.error}`;
          return copy;
        });
      } else if (data.video_url) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = "Here's your generated video";
          copy[copy.length - 1].videos = [data.video_url];
          return copy;
        });
        if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: prompt, images: [data.video_url] });
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
    const a = document.createElement("a"); a.href = url; a.download = "generated.mp4"; a.target = "_blank"; a.click();
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-background to-background pointer-events-none" />

        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="videos" selectedModelId={selectedModel.id} />

        <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-background/50 backdrop-blur-xl">
          <button onClick={() => navigate("/videos")} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.p key={heroIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }} className="text-sm font-bold">
                <span className="text-foreground">{HERO_TEXTS[heroIdx].main} </span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx].accent}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
              <div className="w-full max-w-[280px] rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
                <img src={studioHero} alt="" className="w-full h-auto" />
              </div>
              <div>
                <AnimatePresence mode="wait">
                  <motion.div key={heroIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xl font-bold text-foreground">{HERO_TEXTS[heroIdx].main}</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx].accent}</p>
                  </motion.div>
                </AnimatePresence>
                <p className="text-sm text-muted-foreground mt-2">Describe your video or attach an image</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary/15 rounded-2xl rounded-br-md p-3" : "p-1"}`}>
                {msg.attachedImage && <img src={msg.attachedImage} alt="" className="w-32 h-32 object-cover rounded-xl mb-2" />}
                {msg.content && <div className={`text-sm text-foreground ${msg.role === "assistant" ? "px-2 py-1" : ""}`}>{msg.content}</div>}
                {msg.role === "assistant" && !msg.content && isGenerating && (
                  <div className="flex items-center justify-center py-8"><OrbLoader visible={true} /></div>
                )}
                {msg.videos && msg.videos.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.videos.map((url, i) => (
                      <div key={i}>
                        <video src={url} controls className="w-full rounded-2xl" />
                        <div className="flex items-center gap-1.5 mt-2 px-1">
                          <button onClick={() => handleDownload(url)} className="p-2 rounded-xl bg-accent/50 hover:bg-accent transition-colors"><Download className="w-4 h-4 text-foreground" /></button>
                          <button className="p-2 rounded-xl bg-accent/50 hover:bg-accent transition-colors"><ThumbsUp className="w-4 h-4 text-foreground" /></button>
                          <button className="p-2 rounded-xl bg-accent/50 hover:bg-accent transition-colors"><Share2 className="w-4 h-4 text-foreground" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 p-3 bg-background/80 backdrop-blur-xl">
          {attachedImage && (
            <div className="mb-2 relative inline-block">
              <img src={attachedImage} alt="" className="w-16 h-16 object-cover rounded-xl" />
              <button onClick={() => setAttachedImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex items-end gap-2 bg-card/60 rounded-2xl p-2">
            <button onClick={() => setModelPickerOpen(true)} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors overflow-hidden">
              <img src={selectedModel.iconUrl || "/model-logos/bytedance.ico"} alt="" className="w-5 h-5 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/model-logos/bytedance.ico"; }} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground">
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={STUDIO_PLACEHOLDERS[placeholderIdx]}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/40 max-h-24 py-2"
            />
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

export default VideoStudioPage;
