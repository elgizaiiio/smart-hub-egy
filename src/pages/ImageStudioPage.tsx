import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, X, Trash2, Image as ImageIcon, ArrowUp, Sparkles } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  getImageModelCapability,
} from "@/lib/imageModelCapabilities";

const STYLE_SUFFIX: Record<string, string> = {
  none: "",
  cinematic: ", cinematic lighting, dramatic shadows, film grain, movie still",
  creative: ", creative art style, imaginative composition, artistic",
  dynamic: ", dynamic composition, energetic, motion blur, dramatic angles",
  fashion: ", fashion photography, editorial style, studio lighting, vogue",
  portrait: ", portrait photography, shallow depth of field, bokeh, studio lighting",
  "stock-photo": ", professional stock photography, clean composition, commercial",
  vibrant: ", vibrant colors, saturated, colorful, high contrast",
  anime: ", anime style, manga art, Japanese animation, cel shading",
  "3d-render": ", 3D render, Octane render, Blender, CGI, volumetric lighting",
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capability = useMemo(() => getImageModelCapability(selectedModel.id), [selectedModel.id]);
  const creditCost = (Number(selectedModel.credits) || 1) * settings.numImages;

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-generate if navigated with state
  useEffect(() => {
    if (location.state?.prompt) {
      setInput(location.state.prompt);
      handleGenerate(location.state.prompt, location.state.model, location.state.settings);
      // Clear state so refresh doesn't re-trigger
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
      .eq("mode", "images")
      .order("updated_at", { ascending: false })
      .limit(20);

    if (!convos || convos.length === 0) return;

    const ids = convos.map(c => c.id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", ids)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(50);

    if (msgs) {
      const images: GeneratedImage[] = [];
      msgs.forEach(m => {
        if (m.images) {
          (m.images as string[]).forEach(url => {
            images.push({
              id: crypto.randomUUID(),
              url,
              prompt: m.content,
              model: "",
              modelId: "",
              dimensions: "1024×1024",
              createdAt: new Date(m.created_at),
            });
          });
        }
      });
      setGeneratedImages(images);
    }
  };

  const handleGenerate = async (
    promptOverride?: string,
    modelOverride?: ModelOption,
    settingsOverride?: ImageSettings
  ) => {
    const prompt = promptOverride || input.trim();
    const model = modelOverride || selectedModel;
    const s = settingsOverride || settings;
    if (!prompt) return;

    const cost = (Number(model.credits) || 1) * s.numImages;
    if (userId && !hasEnoughCredits(cost)) {
      toast.error("Insufficient MC credits.");
      return;
    }

    const styleSuffix = STYLE_SUFFIX[s.style] || "";
    const finalPrompt = prompt + styleSuffix;

    setInput("");
    setIsGenerating(true);
    setProgress(0);

    // Fake progress
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 500);

    // Create conversation
    const { data: { user } } = await supabase.auth.getUser();
    let convId: string | null = null;
    if (user) {
      const { data } = await supabase
        .from("conversations")
        .insert({ title: prompt.slice(0, 50), mode: "images", model: model.id, user_id: user.id } as any)
        .select("id")
        .single();
      convId = data?.id || null;
      if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: prompt });
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: model.id,
          user_id: userId,
          credits_cost: cost,
          num_images: s.numImages,
          image_size: { width: s.dimensions.width, height: s.dimensions.height },
        }),
      });

      const data = await resp.json();
      clearInterval(interval);
      setProgress(100);

      if (data.error) {
        toast.error(data.error);
      } else {
        const urls: string[] = data.image_urls || (data.image_url ? [data.image_url] : []);
        const newImages: GeneratedImage[] = urls.map(url => ({
          id: crypto.randomUUID(),
          url,
          prompt,
          model: model.name,
          modelId: model.id,
          dimensions: `${s.dimensions.width}×${s.dimensions.height}`,
          createdAt: new Date(),
        }));
        setGeneratedImages(prev => [...newImages, ...prev]);
        if (convId) await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: prompt, images: urls });
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
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative">
        <ModelPickerSheet
          open={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          onSelect={(m) => { setSelectedModel(m); setModelPickerOpen(false); }}
          mode="images"
          selectedModelId={selectedModel.id}
        />

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <button onClick={() => navigate("/images")} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-bold text-foreground">Image Studio</h1>
          </div>
          {generatedImages.length > 0 && (
            <span className="text-xs text-muted-foreground">{generatedImages.length} images</span>
          )}
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 border-b border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-foreground font-medium">Generating...</span>
                <span className="text-xs text-muted-foreground ml-auto">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto pb-32 px-6 py-6">
          {generatedImages.length === 0 && !isGenerating ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-primary/30" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">No images yet</h2>
              <p className="text-sm text-muted-foreground">Generate your first image below</p>
            </div>
          ) : (
            <div className="columns-2 lg:columns-3 xl:columns-4 gap-4">
              {generatedImages.map(img => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-inside-avoid mb-4 group relative rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setPreview({ url: img.url, prompt: img.prompt, model: img.model, dimensions: img.dimensions })}
                >
                  <img src={img.url} alt={img.prompt} className="w-full rounded-2xl object-cover pointer-events-auto" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3">
                    <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview modal */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setPreview(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
                onClick={e => e.stopPropagation()}
              >
                <img src={preview.url} alt={preview.prompt} className="max-w-full max-h-[75vh] rounded-2xl object-contain pointer-events-auto" />
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-white/80 text-sm max-w-md truncate">{preview.prompt}</p>
                  <button
                    onClick={() => handleDownload(preview.url, preview.prompt)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <button onClick={() => setPreview(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
                  <X className="w-4 h-4" />
                </button>
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
