import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Download, Paperclip, X, ChevronDown, Sparkles, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { IMAGE_MODELS, type ModelOption } from "@/components/ModelSelector";
import { getImageModelCapability } from "@/lib/imageModelCapabilities";

const IMAGE_PHRASES = [
  "Your vision, painted in pixels.",
  "A masterpiece, freshly rendered.",
  "Art born from your words.",
  "Where thought becomes sight.",
  "From mind to masterpiece.",
  "Digital alchemy at its finest.",
  "Imagination rendered in high fidelity.",
];

interface AttachedImage {
  id: string;
  dataUrl: string;
  name: string;
}

interface GeneratedResult {
  prompt: string;
  imageUrl: string;
  model: string;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

const getRandomPhrase = () => IMAGE_PHRASES[Math.floor(Math.random() * IMAGE_PHRASES.length)];

// Only text-to-image models (no tools that require image input)
const GENERATOR_MODELS = IMAGE_MODELS.filter((m) => !m.requiresImage);
const TOOL_MODELS = IMAGE_MODELS.filter((m) => m.requiresImage);

const ImageGenerator = () => {
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(GENERATOR_MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "tools">("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const capability = useMemo(() => getImageModelCapability(selectedModel.id), [selectedModel.id]);

  // Close picker on outside click
  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelPicker]);

  // Clear attached images when switching to a model that doesn't accept images
  useEffect(() => {
    if (!capability.acceptsImages && attachedImages.length > 0) {
      setAttachedImages([]);
    }
  }, [capability.acceptsImages]);

  const handleGenerate = async () => {
    const trimmed = input.trim();
    if (!trimmed && attachedImages.length === 0) return;

    if (capability.requiresImage && attachedImages.length === 0) {
      toast.error(`${selectedModel.name} requires at least one image.`);
      return;
    }

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.info("Please sign in to generate images.");
      navigate("/auth");
      return;
    }

    const creditCost = Number(selectedModel.credits) || 1;
    if (!hasEnoughCredits(creditCost)) {
      toast.error("Insufficient credits. Please top up your account.");
      return;
    }

    setIsGenerating(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: trimmed || `Generate with ${selectedModel.name}`,
          model: selectedModel.id,
          image_url: attachedImages[0]?.dataUrl,
          image_urls: attachedImages.map((img) => img.dataUrl),
          user_id: userId,
          credits_cost: creditCost,
        }),
      });

      const data = await resp.json();

      if (data.error) {
        toast.error(data.error);
      } else if (data.image_url) {
        setResults((prev) => [
          { prompt: trimmed, imageUrl: data.image_url, model: selectedModel.name },
          ...prev,
        ]);
        toast.success(getRandomPhrase());
      } else {
        toast.error("No image was returned. Please try again.");
      }
    } catch {
      toast.error("Generation failed. Please try again.");
    }

    setIsGenerating(false);
    setInput("");
    setAttachedImages([]);
    refreshCredits();
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!capability.acceptsImages) {
      toast.error(`${selectedModel.name} doesn't accept image input.`);
      e.target.value = "";
      return;
    }
    const remaining = Math.max(capability.maxImages - attachedImages.length, 0);
    const filesToUse = files.slice(0, remaining);
    try {
      const loaded = await Promise.all(
        filesToUse.map(async (f) => ({
          id: crypto.randomUUID(),
          dataUrl: await readFileAsDataUrl(f),
          name: f.name,
        }))
      );
      setAttachedImages((prev) => [...prev, ...loaded]);
    } catch {
      toast.error("Failed to read image");
    }
    e.target.value = "";
  };

  const currentModels = activeTab === "generate" ? GENERATOR_MODELS : TOOL_MODELS;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 hidden lg:block">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-4xl font-black uppercase md:text-5xl lg:text-6xl">
          TRY IT <span className="text-primary">NOW</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Generate real images right here. Pick a model, type your prompt, and watch the magic happen.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-border/30 px-6 pt-4">
          <button
            onClick={() => { setActiveTab("generate"); setSelectedModel(GENERATOR_MODELS[0]); setAttachedImages([]); }}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "generate" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Text to Image
          </button>
          <button
            onClick={() => { setActiveTab("tools"); setSelectedModel(TOOL_MODELS[0]); setAttachedImages([]); }}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === "tools" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Image Tools
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Model Picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm"
            >
              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium text-foreground">{selectedModel.name}</span>
              <span className="text-xs text-primary">{selectedModel.credits} MC</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 left-0 z-50 w-80 max-h-72 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-2xl p-2"
                >
                  {currentModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m); setShowModelPicker(false); setAttachedImages([]); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${m.id === selectedModel.id ? "bg-primary/10 text-primary" : "hover:bg-secondary/50 text-foreground"}`}
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.credits} MC</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attached images preview */}
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-3">
              {attachedImages.map((img) => (
                <div key={img.id} className="relative">
                  <img src={img.dataUrl} alt={img.name} className="w-16 h-16 rounded-xl object-cover border border-border/30" />
                  <button
                    onClick={() => setAttachedImages((p) => p.filter((i) => i.id !== img.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="relative flex items-end gap-3 rounded-2xl border border-border/40 bg-secondary/20 px-4 py-3">
            {capability.acceptsImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                title={`Attach image (max ${capability.maxImages})`}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={activeTab === "generate" ? "Describe your image... e.g. A futuristic city at sunset" : `Describe what to do with the image using ${selectedModel.name}...`}
              rows={2}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-1"
            />

            <button
              onClick={handleGenerate}
              disabled={(!input.trim() && attachedImages.length === 0) || isGenerating}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </button>
          </div>

          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />

          {/* Helper text */}
          <p className="text-xs text-muted-foreground">{capability.helperText}</p>
        </div>

        {/* Results */}
        <AnimatePresence>
          {(isGenerating || results.length > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="border-t border-border/30 p-6"
            >
              {isGenerating && (
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Creating your image...</p>
                    <p className="text-xs text-muted-foreground">Using {selectedModel.name}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-2xl overflow-hidden border border-border/30"
                  >
                    <img src={result.imageUrl} alt={result.prompt} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white/90 line-clamp-2 mb-2">{result.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{result.model}</span>
                        <button
                          onClick={() => window.open(result.imageUrl, "_blank")}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default ImageGenerator;
