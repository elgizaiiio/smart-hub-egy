import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Image as ImageIcon, Sparkles, Grid3X3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import { DEFAULT_SETTINGS, type ImageSettings } from "@/components/ImageSettingsPanel";
import BottomInputBar from "@/components/BottomInputBar";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import StudioLoader from "@/components/StudioLoader";
import { getImageModelCapability } from "@/lib/imageModelCapabilities";

// Style suffixes removed — styles are now per-model via admin bot customization

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  modelId: string;
  dimensions: string;
  createdAt: Date;
}

interface PreviewImage {
  url: string;
  prompt: string;
  model: string;
  dimensions: string;
}

const ImageStudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [selectedModel, setSelectedModel] = useState<ModelOption>(() =>
    location.state?.model || getDefaultModel("images")
  );
  const [settings, setSettings] = useState<ImageSettings>(() =>
    location.state?.settings || DEFAULT_SETTINGS
  );
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const capability = useMemo(() => getImageModelCapability(selectedModel.id), [selectedModel.id]);
  const creditCost = (Number(selectedModel.credits) || 1) * settings.numImages;

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
    const { data: convos } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "images").order("updated_at", { ascending: false }).limit(20);
    if (!convos?.length) return;
    const { data: msgs } = await supabase.from("messages").select("*").in("conversation_id", convos.map(c => c.id)).eq("role", "assistant").order("created_at", { ascending: false }).limit(50);
    if (msgs) {
      const images: GeneratedImage[] = [];
      msgs.forEach(m => {
        if (m.images) {
          (m.images as string[]).forEach(url => {
            images.push({ id: crypto.randomUUID(), url, prompt: m.content, model: "", modelId: "", dimensions: "1024×1024", createdAt: new Date(m.created_at) });
          });
        }
      });
      setGeneratedImages(images);
    }
  };

  const handleGenerate = async (promptOverride?: string, modelOverride?: ModelOption, settingsOverride?: ImageSettings) => {
    const prompt = promptOverride || input.trim();
    const model = modelOverride || selectedModel;
    const s = settingsOverride || settings;
    if (!prompt) return;
    const cost = (Number(model.credits) || 1) * s.numImages;
    if (userId && !hasEnoughCredits(cost)) { toast.error("Insufficient MC credits."); return; }
    const finalPrompt = prompt;
    setInput("");
    setIsGenerating(true);
    setProgress(0);
    setShowGrid(false);
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 15, 90)), 500);
    const { data: { user } } = await supabase.auth.getUser();
    let convId: string | null = null;
    if (user) {
      const { data } = await supabase.from("conversations").insert({ title: prompt.slice(0, 50), mode: "images", model: model.id, user_id: user.id } as any).select("id").single();
      convId = data?.id || null;
      if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: prompt });
    }
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt: finalPrompt, model: model.id, user_id: userId, credits_cost: cost, num_images: s.numImages, image_size: { width: s.dimensions.width, height: s.dimensions.height } }),
      });
      const data = await resp.json();
      clearInterval(interval);
      setProgress(100);
      if (data.error) { toast.error(data.error); }
      else {
        const urls: string[] = data.image_urls || (data.image_url ? [data.image_url] : []);
        const newImages: GeneratedImage[] = urls.map(url => ({ id: crypto.randomUUID(), url, prompt, model: model.name, modelId: model.id, dimensions: `${s.dimensions.width}×${s.dimensions.height}`, createdAt: new Date() }));
        setGeneratedImages(prev => [...newImages, ...prev]);
        setActiveIndex(0);
        if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: prompt, images: urls });
      }
    } catch { clearInterval(interval); toast.error("Generation failed."); }
    setIsGenerating(false);
    setTimeout(() => setProgress(0), 1000);
    refreshCredits();
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a"); a.href = url; a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.png`; a.target = "_blank"; a.click();
  };

  const currentImage = generatedImages[activeIndex];

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative">
        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="images" selectedModelId={selectedModel.id} />

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - history thumbnails */}
          {generatedImages.length > 0 && (
            <div className="w-14 border-r border-border flex flex-col items-center gap-2 py-3 overflow-y-auto scrollbar-hide">
              <button onClick={() => setShowGrid(!showGrid)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'hover:bg-accent text-muted-foreground'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <div className="w-6 border-t border-border my-1" />
              {generatedImages.slice(0, 20).map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => { setActiveIndex(i); setShowGrid(false); }}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeIndex === i && !showGrid ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-border'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover pointer-events-auto" />
                </button>
              ))}
            </div>
          )}

          {/* Main canvas area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center bg-card/30 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                    <StudioLoader progress={progress} message="Your image is on its way..." />
                  </motion.div>
                ) : showGrid ? (
                  <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full overflow-y-auto p-6 pb-32">
                    <div className="columns-2 lg:columns-3 xl:columns-4 gap-3">
                      {generatedImages.map((img, i) => (
                        <motion.div key={img.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden cursor-pointer"
                          onClick={() => { setActiveIndex(i); setShowGrid(false); }}
                        >
                          <img src={img.url} alt={img.prompt} className="w-full rounded-2xl object-cover pointer-events-auto" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3">
                            <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : currentImage ? (
                  <motion.div key={currentImage.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className="relative max-w-[80%] max-h-[80%] group cursor-pointer"
                    onClick={() => setPreview({ url: currentImage.url, prompt: currentImage.prompt, model: currentImage.model, dimensions: currentImage.dimensions })}
                  >
                    <img src={currentImage.url} alt={currentImage.prompt} className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl pointer-events-auto" />
                    {/* Floating download button */}
                    <button onClick={e => { e.stopPropagation(); handleDownload(currentImage.url, currentImage.prompt); }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                      <Download className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                      <ImageIcon className="w-10 h-10 text-primary/30" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Create something amazing</h2>
                    <p className="text-sm text-muted-foreground">Describe your image below to get started</p>
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
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <img src={preview.url} alt={preview.prompt} className="max-w-full max-h-[75vh] rounded-2xl object-contain pointer-events-auto" />
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
        <BottomInputBar
          input={input}
          onInputChange={setInput}
          onGenerate={() => handleGenerate()}
          isGenerating={isGenerating}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onOpenModelPicker={() => setModelPickerOpen(true)}
          settings={settings}
          onSettingsChange={setSettings}
          creditCost={creditCost}
          canAttach={capability.acceptsImages}
          onAttach={() => fileInputRef.current?.click()}
        />
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
      </div>
    </AppLayout>
  );
};

export default ImageStudioPage;
