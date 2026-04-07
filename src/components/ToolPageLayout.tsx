import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, X, Share2, Sparkles, ImagePlus, Wand2, Camera, Palette, Scissors, Layers, Zap, Film, Type, Mic, Volume2, Eye as EyeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";

// Tool metadata for landing pages
const TOOL_META: Record<string, { headline: string; accent: string; desc: string; gradient: string; icon: any }> = {
  'inpaint': { headline: 'AI', accent: 'Inpainting', desc: 'Edit and replace any part of your image with AI-powered precision', gradient: 'from-violet-600/30 via-purple-500/20 to-fuchsia-600/30', icon: Wand2 },
  'clothes-changer': { headline: 'Change', accent: 'Outfits', desc: 'Transform clothing styles instantly using artificial intelligence', gradient: 'from-pink-600/30 via-rose-500/20 to-orange-500/30', icon: Scissors },
  'headshot': { headline: 'Professional', accent: 'Headshots', desc: 'Studio-quality professional portraits generated in seconds', gradient: 'from-blue-600/30 via-cyan-500/20 to-teal-500/30', icon: Camera },
  'bg-remover': { headline: 'Remove', accent: 'Backgrounds', desc: 'Clean and precise background removal with one click', gradient: 'from-emerald-600/30 via-green-500/20 to-teal-500/30', icon: Layers },
  'face-swap': { headline: 'Face', accent: 'Swap', desc: 'Seamlessly swap faces between any two photographs', gradient: 'from-amber-600/30 via-orange-500/20 to-red-500/30', icon: Sparkles },
  'relight': { headline: 'AI', accent: 'Relight', desc: 'Dramatically change the lighting and mood of any photo', gradient: 'from-yellow-600/30 via-amber-500/20 to-orange-500/30', icon: Zap },
  'colorizer': { headline: 'Colorize', accent: 'Photos', desc: 'Bring black and white photos to vivid, realistic life', gradient: 'from-cyan-600/30 via-blue-500/20 to-indigo-500/30', icon: Palette },
  'character-swap': { headline: 'Character', accent: 'Swap', desc: 'Replace characters in any scene with a new face', gradient: 'from-indigo-600/30 via-violet-500/20 to-purple-500/30', icon: Sparkles },
  'storyboard': { headline: 'AI', accent: 'Storyboard', desc: 'Create cinematic storyboard panels from your ideas', gradient: 'from-slate-600/30 via-gray-500/20 to-zinc-500/30', icon: Film },
  'sketch-to-image': { headline: 'Sketch to', accent: 'Image', desc: 'Turn rough sketches into stunning realistic images', gradient: 'from-teal-600/30 via-emerald-500/20 to-green-500/30', icon: Wand2 },
  'retouching': { headline: 'Photo', accent: 'Retouching', desc: 'Professional-grade beauty and skin retouching', gradient: 'from-rose-600/30 via-pink-500/20 to-fuchsia-500/30', icon: Camera },
  'remover': { headline: 'Object', accent: 'Remover', desc: 'Erase unwanted objects and people from photos cleanly', gradient: 'from-red-600/30 via-rose-500/20 to-pink-500/30', icon: Scissors },
  'hair-changer': { headline: 'Change', accent: 'Hairstyle', desc: 'Try new hairstyles and colors with AI instantly', gradient: 'from-fuchsia-600/30 via-purple-500/20 to-violet-500/30', icon: Sparkles },
  'cartoon': { headline: 'AI', accent: 'Cartoon', desc: 'Transform your photos into stunning cartoon artwork', gradient: 'from-orange-600/30 via-yellow-500/20 to-amber-500/30', icon: Palette },
  'avatar-generator': { headline: 'AI', accent: 'Avatar', desc: 'Generate unique personal AI avatars from your photo', gradient: 'from-violet-600/30 via-indigo-500/20 to-blue-500/30', icon: Sparkles },
  'product-photo': { headline: 'Product', accent: 'Photography', desc: 'Professional product shots for e-commerce and ads', gradient: 'from-sky-600/30 via-blue-500/20 to-indigo-500/30', icon: Camera },
  'logo-generator': { headline: 'AI Logo', accent: 'Generator', desc: 'Design unique, professional logos with AI power', gradient: 'from-purple-600/30 via-violet-500/20 to-indigo-500/30', icon: Wand2 },
  'perspective-correction': { headline: 'Fix', accent: 'Perspective', desc: 'Correct distorted perspectives in architectural photos', gradient: 'from-blue-600/30 via-sky-500/20 to-cyan-500/30', icon: Layers },
  'green-screen': { headline: 'Green', accent: 'Screen', desc: 'Remove green screen backgrounds from video footage', gradient: 'from-green-600/30 via-emerald-500/20 to-teal-500/30', icon: Film },
  'video-colorizer': { headline: 'Colorize', accent: 'Video', desc: 'Add vibrant color to old black and white footage', gradient: 'from-cyan-600/30 via-teal-500/20 to-emerald-500/30', icon: Palette },
  'video-watermark': { headline: 'Video', accent: 'Watermark', desc: 'Add professional watermarks to protect your videos', gradient: 'from-slate-600/30 via-gray-500/20 to-zinc-500/30', icon: Type },
  'video-bg-replacer': { headline: 'Replace', accent: 'Background', desc: 'Change video backgrounds to any scene or color', gradient: 'from-indigo-600/30 via-blue-500/20 to-sky-500/30', icon: Layers },
  'video-intro': { headline: 'Video', accent: 'Intro', desc: 'Create stunning professional video introductions', gradient: 'from-amber-600/30 via-yellow-500/20 to-orange-500/30', icon: Film },
  'video-denoise': { headline: 'Denoise', accent: 'Video', desc: 'Remove noise and grain from video footage', gradient: 'from-gray-600/30 via-slate-500/20 to-zinc-500/30', icon: Zap },
  'thumbnail-generator': { headline: 'AI', accent: 'Thumbnails', desc: 'Generate eye-catching YouTube thumbnail images', gradient: 'from-red-600/30 via-orange-500/20 to-yellow-500/30', icon: Camera },
  'auto-caption': { headline: 'Auto', accent: 'Caption', desc: 'Add accurate subtitles to your videos automatically', gradient: 'from-blue-600/30 via-indigo-500/20 to-violet-500/30', icon: Type },
  'lip-sync': { headline: 'Lip', accent: 'Sync', desc: 'Sync lip movements to any audio track perfectly', gradient: 'from-pink-600/30 via-rose-500/20 to-red-500/30', icon: Mic },
  'video-extender': { headline: 'Extend', accent: 'Video', desc: 'Make your videos longer with AI-generated content', gradient: 'from-teal-600/30 via-cyan-500/20 to-blue-500/30', icon: Film },
  'video-to-text': { headline: 'Video to', accent: 'Text', desc: 'Transcribe video content into accurate text', gradient: 'from-emerald-600/30 via-green-500/20 to-lime-500/30', icon: Type },
  'talking-photo': { headline: 'Talking', accent: 'Photo', desc: 'Animate photos and make them speak any text', gradient: 'from-violet-600/30 via-purple-500/20 to-pink-500/30', icon: Mic },
  'video-upscale': { headline: 'Upscale', accent: 'Video', desc: 'Enhance video resolution to crystal-clear quality', gradient: 'from-sky-600/30 via-blue-500/20 to-indigo-500/30', icon: Zap },
  'video-swap': { headline: 'Video Face', accent: 'Swap', desc: 'Swap faces in video footage seamlessly', gradient: 'from-orange-600/30 via-amber-500/20 to-yellow-500/30', icon: Sparkles },
};

// ==================== Types ====================
export interface ToolTemplate {
  id: string;
  tool_id: string;
  name: string;
  prompt: string | null;
  preview_url: string | null;
  gender: string;
}

interface ToolPageLayoutProps {
  title: string;
  cost: number;
  costLabel?: string;
  toolId: string;
  children?: React.ReactNode;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  resultUrl?: string | null;
  resultType?: "image" | "video";
  autoProcess?: boolean;
  hideHeaderCost?: boolean;
  backTo?: string;
  onFileSelected?: (dataUrl: string) => void;
  skipLanding?: boolean;
}

const TOOL_LOADING_TEXTS = [
  { text: "CREATING", accent: "MAGIC" },
  { text: "PROCESSING", accent: "YOUR IMAGE" },
  { text: "REFINING", accent: "DETAILS" },
  { text: "ALMOST", accent: "READY" },
];

const StarLoader = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TOOL_LOADING_TEXTS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const current = TOOL_LOADING_TEXTS[idx];
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          y: [0, -8, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z"
          fill="url(#toolStarGrad)"
        />
        <defs>
          <linearGradient id="toolStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </motion.svg>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-center"
        >
          <p className="text-2xl font-black text-foreground">{current.text}</p>
          <p className="text-2xl font-black bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            {current.accent}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ==================== Landing Page ====================
const ToolLanding = ({
  onStart,
  uploadLabel = "Upload Your Photo",
  accept = "image/*",
  toolId,
}: {
  onStart: (file: File) => void;
  uploadLabel?: string;
  accept?: string;
  toolId?: string;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = toolId ? TOOL_META[toolId] : null;
  const Icon = meta?.icon || Sparkles;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onStart(file);
    e.target.value = "";
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Silky gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${meta?.gradient || 'from-violet-600/30 via-purple-500/20 to-pink-600/30'}`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)]" />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-violet-500/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [15, -15, 15], x: [10, -10, 10] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[10%] w-40 h-40 rounded-full bg-pink-500/10 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-6"
        >
          <Icon className="w-8 h-8 text-foreground/80" />
        </motion.div>

        {/* Headlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-5xl font-black text-foreground leading-[1.1] tracking-tight">
            {meta?.headline || "AI"}
          </h2>
          <h2 className="text-5xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-[1.1] tracking-tight">
            {meta?.accent || "Tool"}
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-[280px]"
        >
          {meta?.desc || "Transform your media with AI"}
        </motion.p>

        {/* Upload button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8"
        >
          <input ref={fileRef} type="file" className="hidden" accept={accept} onChange={handleFileChange} />
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => fileRef.current?.click()}
            className="px-8 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-foreground font-semibold text-base shadow-2xl shadow-black/20 hover:bg-white/20 transition-colors flex items-center gap-2.5"
          >
            <Upload className="w-5 h-5" />
            {uploadLabel}
          </motion.button>
        </motion.div>

        {/* Subtle features line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 mt-6 text-[11px] text-muted-foreground/60"
        >
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Fast</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI-Powered</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> HD</span>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== Yellow Generate Button ====================
const YellowGenerateButton = ({
  cost, costLabel, onClick, disabled, isGenerating,
}: {
  cost: number; costLabel?: string; onClick: () => void; disabled?: boolean; isGenerating: boolean;
}) => (
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-yellow-500/20"
    >
      {isGenerating ? (
        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      ) : (
        <>Generate · {costLabel || `${cost} MC`}</>
      )}
    </motion.button>
  </div>
);

// ==================== Result View ====================
const ResultView = ({
  resultUrl, resultType = "image", title, onBack,
}: {
  resultUrl: string; resultType?: "image" | "video"; title: string; onBack: () => void;
}) => {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-result.${resultType === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = async () => {
    navigator.clipboard.writeText(resultUrl);
    toast.success("Link copied!");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl overflow-hidden border border-border/20">
        {resultType === "video" ? (
          <video src={resultUrl} controls autoPlay className="w-full" />
        ) : (
          <img src={resultUrl} alt="Result" className="w-full" />
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">
          <Download className="w-4 h-4" /> Download
        </button>
        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
      <button onClick={onBack} className="w-full py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium">
        Try Again
      </button>
    </div>
  );
};

// ==================== Template Grid ====================
export const TemplateGrid = ({
  templates, onSelect, onCustom, customLabel = "Custom", gender, onGenderChange,
}: {
  templates: ToolTemplate[];
  onSelect: (template: ToolTemplate) => void;
  onCustom?: () => void;
  customLabel?: string;
  gender?: "male" | "female";
  onGenderChange?: (g: "male" | "female") => void;
}) => {
  const filtered = gender ? templates.filter(t => t.gender === "both" || t.gender === gender) : templates;

  return (
    <div className="space-y-4">
      {onGenderChange && (
        <div className="flex gap-2">
          <button onClick={() => onGenderChange("female")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>Female</button>
          <button onClick={() => onGenderChange("male")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>Male</button>
        </div>
      )}
      {onCustom && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCustom} className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center hover:border-primary/50 transition-colors">
          <p className="text-sm font-semibold text-primary">{customLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Create your own style</p>
        </motion.button>
      )}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(t => (
          <motion.button key={t.id} whileTap={{ scale: 0.97 }} onClick={() => onSelect(t)} className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left">
            {t.preview_url ? (
              <img src={t.preview_url} alt={t.name} className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/20" />
              </div>
            )}
            <div className="p-2.5"><p className="text-sm font-medium text-foreground">{t.name}</p></div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ==================== Main Layout ====================
const ToolPageLayout = ({
  title, cost, costLabel, toolId, children, onGenerate, isGenerating, resultUrl, resultType = "image", autoProcess, hideHeaderCost = true, backTo, onFileSelected, skipLanding = false,
}: ToolPageLayoutProps) => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [showLanding, setShowLanding] = useState(!skipLanding);

  const defaultBack = toolId && (
    ["swap-characters", "talking-photo", "upscale", "video-upscale", "auto-caption", "lip-sync", "video-extender", "video-to-text", "green-screen", "video-colorizer", "video-watermark", "video-bg-replacer", "video-intro", "video-denoise", "thumbnail-generator"].includes(toolId)
  ) ? "/videos" : "/images";
  const goBack = backTo || defaultBack;

  const acceptType = resultType === "video" ? "video/*" : "image/*";
  const uploadLabel = resultType === "video" ? "Upload Your Video" : "Upload Your Photo";

  const handleGenerate = async () => {
    if (!hasEnoughCredits(cost)) {
      toast.error("Insufficient MC credits.", { action: { label: "Top up", onClick: () => navigate("/pricing") } });
      return;
    }
    await onGenerate();
  };

  const handleLandingFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (onFileSelected) {
        onFileSelected(dataUrl);
      }
      setShowLanding(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => navigate(goBack)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1">{title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showLanding && !resultUrl && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ToolLanding
                onStart={handleLandingFileSelect}
                uploadLabel={uploadLabel}
                accept={acceptType}
                toolId={toolId}
              />
            </motion.div>
          )}

          {resultUrl && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ResultView
                resultUrl={resultUrl}
                resultType={resultType}
                title={title}
                onBack={() => navigate(0)}
              />
            </motion.div>
          )}

          {!showLanding && !resultUrl && (
            <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-4 space-y-4 pb-32">
              {isGenerating ? <StarLoader /> : children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showLanding && !resultUrl && !autoProcess && !isGenerating && (
        <YellowGenerateButton cost={cost} costLabel={costLabel} onClick={handleGenerate} isGenerating={isGenerating} />
      )}
    </div>
  );
};

export default ToolPageLayout;

// ==================== Upload Boxes ====================
export const ImageUploadBox = ({
  label, image, onUpload, onClear, accept = "image/*",
}: {
  label: string; image: string | null; onUpload: (dataUrl: string) => void; onClear: () => void; accept?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (image) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <img src={image} alt={label} className="w-full h-48 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} className="w-full h-48 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-gradient-to-br from-accent/20 to-accent/5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ImagePlus className="w-7 h-7 text-primary/60" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </button>
      <input ref={ref} type="file" className="hidden" accept={accept} onChange={handleChange} />
    </>
  );
};

export const VideoUploadBox = ({
  label, video, onUpload, onClear,
}: {
  label: string; video: string | null; onUpload: (dataUrl: string) => void; onClear: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (video) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <video src={video} controls className="w-full h-48 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} className="w-full h-48 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-gradient-to-br from-accent/20 to-accent/5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary/60" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </button>
      <input ref={ref} type="file" className="hidden" accept="video/*" onChange={handleChange} />
    </>
  );
};

export const AudioUploadBox = ({
  label, audioName, onUpload, onClear,
}: {
  label: string; audioName: string | null; onUpload: (dataUrl: string, name: string) => void; onClear: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string, file.name);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (audioName) {
    return (
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-accent border border-border/30">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary/60" />
        </div>
        <span className="text-sm text-foreground flex-1 truncate">{audioName}</span>
        <button onClick={onClear} className="text-muted-foreground"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} className="w-full py-4 rounded-2xl border-2 border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-3 hover:border-primary/50 transition-colors bg-gradient-to-br from-accent/20 to-accent/5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary/60" />
        </div>
        {label}
      </button>
      <input ref={ref} type="file" className="hidden" accept="audio/*" onChange={handleChange} />
    </>
  );
};