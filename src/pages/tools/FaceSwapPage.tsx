import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";
import { ImageUploadBox, TemplateGrid } from "@/components/ToolPageLayout";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import type { ToolTemplate } from "@/components/ToolPageLayout";

type Step = "upload" | "templates" | "generating" | "result";

const FaceSwapPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [step, setStep] = useState<Step>("upload");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { templates } = useToolTemplates("face-swap");
  const customInputRef = useRef<HTMLInputElement>(null);

  const handleSourceUpload = (img: string) => { setSourceImage(img); setStep("templates"); };

  const handleTemplateSelect = (t: ToolTemplate) => { if (t.preview_url) setTargetImage(t.preview_url); };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTargetImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!sourceImage || !targetImage) { toast.error("Please upload both images"); return; }
    if (!hasEnoughCredits(0.5)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStep("generating"); setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "face-swap", image: sourceImage, target: targetImage } });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); setStep("result"); }
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); setStep("templates"); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => navigate("/images")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-base font-semibold text-foreground flex-1">Face Swap</h1>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto pb-32">
        {step === "upload" && <ImageUploadBox label="Upload your photo" image={sourceImage} onUpload={handleSourceUpload} onClear={() => setSourceImage(null)} />}

        {step === "templates" && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-border/30"><img src={sourceImage!} alt="" className="w-full h-40 object-cover" /></div>
            <input ref={customInputRef} type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => customInputRef.current?.click()} className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center hover:border-primary/50 transition-colors">
              <p className="text-sm font-semibold text-primary">Upload Target Face</p>
              <p className="text-xs text-muted-foreground mt-0.5">Or choose from templates below</p>
            </motion.button>
            {targetImage && (
              <div className="flex items-center gap-3">
                <img src={targetImage} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <span className="text-sm text-foreground flex-1">Target face selected</span>
                <button onClick={() => setTargetImage(null)} className="text-xs text-destructive">Remove</button>
              </div>
            )}
            {templates.length > 0 && <TemplateGrid templates={templates} onSelect={handleTemplateSelect} />}
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }} className="relative">
              <Sparkles className="w-12 h-12 text-yellow-400" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 blur-xl bg-yellow-400/30 rounded-full" />
            </motion.div>
            <p className="text-sm text-muted-foreground animate-pulse">Generating...</p>
          </div>
        )}

        {step === "result" && resultUrl && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border/20"><img src={resultUrl} alt="Result" className="w-full" /></div>
            <div className="flex gap-3">
              <button onClick={() => { const a = document.createElement("a"); a.href = resultUrl; a.download = "face-swap-result.png"; a.click(); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"><Download className="w-4 h-4" /> Download</button>
              <button onClick={() => { navigator.share?.({ url: resultUrl }).catch(() => { navigator.clipboard.writeText(resultUrl); toast.success("Copied!"); }); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm"><Share2 className="w-4 h-4" /> Share</button>
            </div>
            <button onClick={() => { setResultUrl(null); setStep("templates"); setTargetImage(null); }} className="w-full py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium">Try Again</button>
          </div>
        )}
      </div>

      {step === "templates" && targetImage && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerate} disabled={isGenerating} className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center shadow-lg shadow-yellow-500/20 disabled:opacity-40">Generate · 0.5 MC</motion.button>
        </div>
      )}
    </div>
  );
};
export default FaceSwapPage;
