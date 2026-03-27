import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";

interface ToolPageLayoutProps {
  title: string;
  cost: number;
  costLabel?: string;
  children: React.ReactNode;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  resultUrl?: string | null;
  resultType?: 'image' | 'video' | '3d';
  previewVideo?: string;
  redirectTo?: string;
}

const ToolPageLayout = ({
  title,
  cost,
  costLabel,
  children,
  onGenerate,
  isGenerating,
  resultUrl,
  resultType = 'image',
  previewVideo,
  redirectTo,
}: ToolPageLayoutProps) => {
  const navigate = useNavigate();
  const { credits, hasEnoughCredits } = useCredits();

  const handleGenerate = async () => {
    if (!hasEnoughCredits(cost)) {
      toast.error("Insufficient MC credits.", { action: { label: "Top up", onClick: () => navigate("/pricing") } });
      return;
    }
    await onGenerate();
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-result.${resultType === 'video' ? 'mp4' : 'png'}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{costLabel || `${cost} MC per generation`}</p>
        </div>
      </div>

      {/* Preview video */}
      {previewVideo && !resultUrl && (
        <div className="px-4 pt-4">
          <video src={previewVideo} autoPlay loop muted playsInline className="w-full max-h-48 rounded-2xl object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-32">
        {children}

        {/* Result */}
        <AnimatePresence>
          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border border-border/50 bg-card"
            >
              {resultType === 'video' ? (
                <video src={resultUrl} controls className="w-full rounded-2xl" />
              ) : (
                <img src={resultUrl} alt="Result" className="w-full rounded-2xl" />
              )}
              <div className="p-3 flex justify-end">
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate · {cost} MC</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ToolPageLayout;

// Reusable upload box component
export const ImageUploadBox = ({
  label,
  image,
  onUpload,
  onClear,
  accept = "image/*",
}: {
  label: string;
  image: string | null;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
  accept?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <img src={image} alt={label} className="w-full h-40 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        className="w-full h-40 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Upload className="w-6 h-6" />
        <span className="text-sm">{label}</span>
      </button>
      <input ref={ref} type="file" className="hidden" accept={accept} onChange={handleChange} />
    </>
  );
};

export const VideoUploadBox = ({
  label,
  video,
  onUpload,
  onClear,
}: {
  label: string;
  video: string | null;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <video src={video} controls className="w-full h-40 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        className="w-full h-40 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Upload className="w-6 h-6" />
        <span className="text-sm">{label}</span>
      </button>
      <input ref={ref} type="file" className="hidden" accept="video/*" onChange={handleChange} />
    </>
  );
};
