import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Video, Sparkles, Grid3X3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import VideoBottomInputBar, { DEFAULT_VIDEO_SETTINGS, type VideoSettings } from "@/components/VideoBottomInputBar";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import StudioLoader from "@/components/StudioLoader";
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
  const [showGrid, setShowGrid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
    const { data: convos } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "videos").order("updated_at", { ascending: false }).limit(20);
    if (!convos?.length) return;
    const { data: msgs } = await supabase.from("messages").select("*").in("conversation_id", convos.map(c => c.id)).eq("role", "assistant").order("created_at", { ascending: false }).limit(30);
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
    setShowGrid(false);
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 8, 90)), 800);
    const { data: { user } } = await supabase.auth.getUser();
    let convId: string | null = null;
    if (user) {
      const { data } = await supabase.from("conversations").insert({ title: prompt.slice(0, 50), mode: "videos", model: model.id, user_id: user.id } as any).select("id").single();
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
        setActiveIndex(0);
        if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: prompt, images: [data.video_url] });
      }
    } catch { clearInterval(interval); toast.error("Generation failed."); }
    setIsGenerating(false);
    setTimeout(() => setProgress(0), 1000);
    refreshCredits();
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a"); a.href = url; a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.mp4`; a.target = "_blank"; a.click();
  };

  const currentVideo = generatedVideos[activeIndex];

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative">
        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="videos" selectedModelId={selectedModel.id} />

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - history thumbnails */}
          {generatedVideos.length > 0 && (
            <div className="w-14 border-r border-border flex flex-col items-center gap-2 py-3 overflow-y-auto scrollbar-hide">
              <button onClick={() => setShowGrid(!showGrid)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'hover:bg-accent text-muted-foreground'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <div className="w-6 border-t border-border my-1" />
              {generatedVideos.slice(0, 20).map((vid, i) => (
                <button
                  key={vid.id}
                  onClick={() => { setActiveIndex(i); setShowGrid(false); }}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeIndex === i && !showGrid ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-border'}`}
                >
                  <video src={vid.url} muted className="w-full h-full object-cover pointer-events-auto" />
                </button>
              ))}
            </div>
          )}

          {/* Main canvas area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-card/30 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                    <StudioLoader progress={progress} message="Your video is on its way..." />
                  </motion.div>
                ) : showGrid ? (
                  <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full overflow-y-auto p-6 pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {generatedVideos.map((vid, i) => (
                        <motion.div key={vid.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className="group relative rounded-2xl overflow-hidden cursor-pointer"
                          onClick={() => { setActiveIndex(i); setShowGrid(false); }}
                        >
                          <video src={vid.url} className="w-full rounded-2xl object-cover aspect-video pointer-events-auto" muted />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3">
                            <p className="text-white text-xs line-clamp-2">{vid.prompt}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : currentVideo ? (
                  <motion.div key={currentVideo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className="relative max-w-[80%] max-h-[80%] group"
                  >
                    <video src={currentVideo.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl pointer-events-auto" />
                    <button onClick={() => handleDownload(currentVideo.url, currentVideo.prompt)}
                      className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                      <Download className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                      <Video className="w-10 h-10 text-primary/30" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Create something amazing</h2>
                    <p className="text-sm text-muted-foreground">Describe your video below to get started</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
