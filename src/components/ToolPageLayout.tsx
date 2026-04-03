import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, X, Share2, Sparkles, ImagePlus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";

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
}

// ==================== Star Loading Animation ====================
const StarLoader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <motion.div
      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
      transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }}
      className="relative"
    >
      <Sparkles className="w-12 h-12 text-yellow-400" />
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 blur-xl bg-yellow-400/30 rounded-full" />
    </motion.div>
    <p className="text-sm text-muted-foreground animate-pulse">Generating...</p>
  </div>
);

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
  resultUrl, resultType = "image", title, onBack, onRegenerate,
}: {
  resultUrl: string; resultType?: "image" | "video"; title: string; onBack: () => void; onRegenerate?: () => void;
}) => {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-result.${resultType === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ url: resultUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(resultUrl);
      toast.success("Link copied!");
    }
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
        {onRegenerate && (
          <button onClick={onRegenerate} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
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
  title, cost, costLabel, toolId, children, onGenerate, isGenerating, resultUrl, resultType = "image", autoProcess, hideHeaderCost = true, backTo, onFileSelected,
}: ToolPageLayoutProps) => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [landingImage, setLandingImage] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState(true);

  const defaultBack = toolId && (
    ["swap-characters", "talking-photo", "upscale", "video-upscale", "auto-caption", "lip-sync", "video-extender", "video-to-text"].includes(toolId)
  ) ? "/videos" : "/images";
  const goBack = backTo || defaultBack;

  const acceptType = resultType === "video" ? "video/*" : "image/*";
  const uploadLabel = resultType === "video" ? "Upload Your Video" : "Upload Your Photo";

  useEffect(() => {
    supabase.from("tool_landing_images").select("image_url").eq("tool_id", toolId).maybeSingle()
      .then(({ data }) => {
        if (data?.image_url) setLandingImage(data.image_url);
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
                onRegenerate={handleGenerate}
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