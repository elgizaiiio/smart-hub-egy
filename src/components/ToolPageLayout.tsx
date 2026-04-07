import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, X, Share2, Sparkles, ImagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";

// Tool metadata for landing pages
const TOOL_META: Record<string, { headline: string; accent: string; desc: string }> = {
  'inpaint': { headline: 'AI', accent: 'Inpainting', desc: 'Edit parts of any image with AI precision' },
  'clothes-changer': { headline: 'Change', accent: 'Outfits', desc: 'Transform clothing with AI styles' },
  'headshot': { headline: 'Professional', accent: 'Headshots', desc: 'Studio-quality portraits in seconds' },
  'bg-remover': { headline: 'Remove', accent: 'Backgrounds', desc: 'Clean background removal instantly' },
  'face-swap': { headline: 'Face', accent: 'Swap', desc: 'Swap faces between any two photos' },
  'relight': { headline: 'AI', accent: 'Relight', desc: 'Change lighting and mood of any photo' },
  'colorizer': { headline: 'Colorize', accent: 'Photos', desc: 'Bring black & white photos to life' },
  'character-swap': { headline: 'Character', accent: 'Swap', desc: 'Replace characters in any scene' },
  'storyboard': { headline: 'AI', accent: 'Storyboard', desc: 'Create cinematic storyboard panels' },
  'sketch-to-image': { headline: 'Sketch to', accent: 'Image', desc: 'Turn sketches into realistic photos' },
  'retouching': { headline: 'Photo', accent: 'Retouching', desc: 'Professional beauty retouching' },
  'remover': { headline: 'Object', accent: 'Remover', desc: 'Erase unwanted objects cleanly' },
  'hair-changer': { headline: 'Change', accent: 'Hairstyle', desc: 'Try new hairstyles with AI' },
  'cartoon': { headline: 'AI', accent: 'Cartoon', desc: 'Transform photos to cartoon art' },
  'avatar-generator': { headline: 'AI', accent: 'Avatar', desc: 'Generate personal AI avatars' },
  'product-photo': { headline: 'Product', accent: 'Photography', desc: 'Professional product shots' },
  'logo-generator': { headline: 'AI Logo', accent: 'Generator', desc: 'Design logos with AI' },
  'perspective-correction': { headline: 'Fix', accent: 'Perspective', desc: 'Correct image distortion' },
  'green-screen': { headline: 'Green', accent: 'Screen', desc: 'Remove green screen backgrounds' },
  'video-colorizer': { headline: 'Colorize', accent: 'Video', desc: 'Add color to old footage' },
  'video-watermark': { headline: 'Video', accent: 'Watermark', desc: 'Add watermarks to your videos' },
  'video-bg-replacer': { headline: 'Replace', accent: 'Background', desc: 'Change video backgrounds' },
  'video-intro': { headline: 'Video', accent: 'Intro', desc: 'Create professional intros' },
  'video-denoise': { headline: 'Denoise', accent: 'Video', desc: 'Remove noise from footage' },
  'thumbnail-generator': { headline: 'AI', accent: 'Thumbnails', desc: 'Generate YouTube thumbnails' },
  'auto-caption': { headline: 'Auto', accent: 'Caption', desc: 'Add subtitles automatically' },
  'lip-sync': { headline: 'Lip', accent: 'Sync', desc: 'Sync lips to any audio' },
  'video-extender': { headline: 'Extend', accent: 'Video', desc: 'Make videos longer with AI' },
  'video-to-text': { headline: 'Video to', accent: 'Text', desc: 'Transcribe video content' },
  'talking-photo': { headline: 'Talking', accent: 'Photo', desc: 'Make photos speak' },
  'video-upscale': { headline: 'Upscale', accent: 'Video', desc: 'Enhance video resolution' },
  'video-swap': { headline: 'Video Face', accent: 'Swap', desc: 'Swap faces in videos' },
};

// Local landing images
const LOCAL_LANDING: Record<string, () => Promise<{ default: string }>> = {
  'inpaint': () => import('@/assets/tool-landing/inpaint.jpg'),
  'clothes-changer': () => import('@/assets/tool-landing/clothes-changer.jpg'),
  'headshot': () => import('@/assets/tool-landing/headshot.jpg'),
  'bg-remover': () => import('@/assets/tool-landing/bg-remover.jpg'),
  'face-swap': () => import('@/assets/tool-landing/face-swap.jpg'),
  'relight': () => import('@/assets/tool-landing/relight.jpg'),
  'colorizer': () => import('@/assets/tool-landing/colorizer.jpg'),
  'sketch-to-image': () => import('@/assets/tool-landing/sketch-to-image.jpg'),
  'retouching': () => import('@/assets/tool-landing/retouching.jpg'),
  'remover': () => import('@/assets/tool-landing/remover.jpg'),
  'hair-changer': () => import('@/assets/tool-landing/hair-changer.jpg'),
  'cartoon': () => import('@/assets/tool-landing/cartoon.jpg'),
  'avatar-generator': () => import('@/assets/tool-landing/avatar-generator.jpg'),
  'product-photo': () => import('@/assets/tool-landing/product-photo.jpg'),
  'logo-generator': () => import('@/assets/tool-landing/logo-generator.jpg'),
  'perspective-correction': () => import('@/assets/tool-landing/perspective-correction.jpg'),
  'storyboard': () => import('@/assets/tool-landing/storyboard.jpg'),
  'character-swap': () => import('@/assets/tool-landing/character-swap.jpg'),
  'green-screen': () => import('@/assets/tool-landing/green-screen.jpg'),
  'video-colorizer': () => import('@/assets/tool-landing/video-colorizer.jpg'),
  'video-watermark': () => import('@/assets/tool-landing/video-watermark.jpg'),
  'video-bg-replacer': () => import('@/assets/tool-landing/video-bg-replacer.jpg'),
  'video-intro': () => import('@/assets/tool-landing/video-intro.jpg'),
  'video-denoise': () => import('@/assets/tool-landing/video-denoise.jpg'),
  'thumbnail-generator': () => import('@/assets/tool-landing/thumbnail-generator.jpg'),
  'auto-caption': () => import('@/assets/tool-landing/auto-caption.jpg'),
  'lip-sync': () => import('@/assets/tool-landing/lip-sync.jpg'),
  'video-extender': () => import('@/assets/tool-landing/video-extender.jpg'),
  'video-to-text': () => import('@/assets/tool-landing/video-to-text.jpg'),
  'talking-photo': () => import('@/assets/tool-landing/talking-photo.jpg'),
  'video-upscale': () => import('@/assets/tool-landing/video-upscale.jpg'),
  'video-swap': () => import('@/assets/tool-landing/video-swap.jpg'),
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
  landingImage,
  onStart,
  uploadLabel = "Upload Your Photo",
  accept = "image/*",
}: {
  landingImage?: string | null;
  onStart: (file: File) => void;
  uploadLabel?: string;
  accept?: string;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onStart(file);
    e.target.value = "";
  };

  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center">
      {landingImage ? (
        <img src={landingImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="relative z-10 text-center px-6">
        <input ref={fileRef} type="file" className="hidden" accept={accept} onChange={handleFileChange} />
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => fileRef.current?.click()}
          className="px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          {uploadLabel}
        </motion.button>
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
  const [landingImage, setLandingImage] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState(!skipLanding);

  const defaultBack = toolId && (
    ["swap-characters", "talking-photo", "upscale", "video-upscale", "auto-caption", "lip-sync", "video-extender", "video-to-text", "green-screen", "video-colorizer", "video-watermark", "video-bg-replacer", "video-intro", "video-denoise", "thumbnail-generator"].includes(toolId)
  ) ? "/videos" : "/images";
  const goBack = backTo || defaultBack;

  const acceptType = resultType === "video" ? "video/*" : "image/*";
  const uploadLabel = resultType === "video" ? "Upload Your Video" : "Upload Your Photo";

  useEffect(() => {
    supabase.from("tool_landing_images").select("image_url").eq("tool_id", toolId).maybeSingle()
      .then(({ data }) => {
        if (data?.image_url) { setLandingImage(data.image_url); return; }
        const loader = LOCAL_LANDING[toolId];
        if (loader) loader().then(m => setLandingImage(m.default));
      });
  }, [toolId]);

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
                landingImage={landingImage}
                onStart={handleLandingFileSelect}
                uploadLabel={uploadLabel}
                accept={acceptType}
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