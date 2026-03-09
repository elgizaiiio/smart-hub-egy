import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, X, Video, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import VideoBottomInputBar, { DEFAULT_VIDEO_SETTINGS, type VideoSettings } from "@/components/VideoBottomInputBar";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import { Progress } from "@/components/ui/progress";
import { getVideoModelCapability } from "@/lib/videoModelCapabilities";

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  duration: string;
  createdAt: Date;
}

interface PreviewVideo {
  url: string;
  prompt: string;
  model: string;
}

const VideoStudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [selectedModel, setSelectedModel] = useState<ModelOption>(() =>
    location.state?.model || getDefaultModel("videos")
  );
  const [settings, setSettings] = useState<VideoSettings>(() =>
    location.state?.settings || DEFAULT_VIDEO_SETTINGS
  );
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [preview, setPreview] = useState<PreviewVideo | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capability = useMemo(() => getVideoModelCapability(selectedModel.id), [selectedModel.id]);
  const creditCost = Number(selectedModel.credits) || 1;

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    if (location.state?.prompt) {
      setInput(location.state.prompt);
      handleGenerate(location.state.prompt, location.state.model, location.state.settings);
      window.history.replaceState({}, "");
    }
  }, []);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("mode", "videos")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (!convos?.length) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convos.map(c => c.id))
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(30);
    if (msgs) {
      const videos: GeneratedVideo[] = [];
      msgs.forEach(m => {
        if (m.images) {
          (m.images as string[]).forEach(url => {
            videos.push({ id: crypto.randomUUID(), url, prompt: m.content, model: "", duration: "5s", createdAt: new Date(m.created_at) });
          });
        }
      });
      setGeneratedVideos(videos);
    }
  };

  const handleGenerate = async (promptOverride?: string, modelOverride?: ModelOption, settingsOverride?: VideoSettings) => {
    const prompt = promptOverride || input.trim();
    const model = modelOverride || selectedModel;
    if (!prompt) return;
    const cost = Number(model.credits) || 1;
    if (userId && !hasEnoughCredits(cost)) { toast.error("Insufficient MC credits."); return; }

    setInput("");
    setIsGenerating(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 8, 90)), 800);

    const { data: { user } } = await supabase.auth.getUser();
    let convId: string | null = null;
    if (user) {
      const { data } = await supabase
        .from("conversations")
        .insert({ title: prompt.slice(0, 50), mode: "videos", model: model.id, user_id: user.id } as any)
        .select("id")
        .single();
      convId = data?.id || null;
      if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: prompt });
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt, model: model.id, user_id: userId, credits_cost: cost }),
      });
      const data = await resp.json();
      clearInterval(interval);
      setProgress(100);
      if (data.error) { toast.error(data.error); }
      else if (data.video_url) {
        const newVid: GeneratedVideo = { id: crypto.randomUUID(), url: data.video_url, prompt, model: model.name, duration: "5s", createdAt: new Date() };
        setGeneratedVideos(prev => [newVid, ...prev]);
        if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: prompt, images: [data.video_url] });
      }
    } catch {
      clearInterval(interval);
      toast.error("Generation failed.");
    }
    setIsGenerating(false);
    setTimeout(() => setProgress(0), 1000);
    refreshCredits();
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a"); a.href = url; a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.mp4`; a.target = "_blank"; a.click();
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative">
        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="videos" selectedModelId={selectedModel.id} />

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <button onClick={() => navigate("/videos")} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><h1 className="text-sm font-bold text-foreground">Video Studio</h1></div>
          {generatedVideos.length > 0 && <span className="text-xs text-muted-foreground">{generatedVideos.length} videos</span>}
        </div>

        {/* Progress */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-foreground font-medium">Generating video...</span>
                <span className="text-xs text-muted-foreground ml-auto">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto pb-32 px-6 py-6">
          {generatedVideos.length === 0 && !isGenerating ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4"><Video className="w-10 h-10 text-primary/30" /></div>
              <h2 className="text-lg font-bold text-foreground mb-1">No videos yet</h2>
              <p className="text-sm text-muted-foreground">Generate your first video below</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {generatedVideos.map(vid => (
                <motion.div key={vid.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => setPreview({ url: vid.url, prompt: vid.prompt, model: vid.model })}>
                  <video src={vid.url} className="w-full rounded-2xl object-cover aspect-video pointer-events-auto" muted />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3">
                    <p className="text-white text-xs line-clamp-2">{vid.prompt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview modal */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <video src={preview.url} controls autoPlay className="w-full rounded-2xl max-h-[75vh] pointer-events-auto" />
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-white/80 text-sm max-w-md truncate">{preview.prompt}</p>
                  <button onClick={() => handleDownload(preview.url, preview.prompt)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
                <button onClick={() => setPreview(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"><X className="w-4 h-4" /></button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom input */}
        <VideoBottomInputBar
          input={input}
          onInputChange={setInput}
          onGenerate={() => handleGenerate()}
          isGenerating={isGenerating}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          settings={settings}
          onSettingsChange={setSettings}
          creditCost={creditCost}
          canAttach={capability.acceptsImages}
          onAttach={() => fileInputRef.current?.click()}
          attachedImages={[]}
          onRemoveAttached={() => {}}
        />
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
      </div>
    </AppLayout>
  );
};

export default VideoStudioPage;
