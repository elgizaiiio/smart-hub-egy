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

type Step = "upload" | "templates" | "custom" | "generating" | "result";

const HairChangerPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [step, setStep] = useState<Step>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { templates } = useToolTemplates("hair-changer");

  const handleUpload = (img: string) => {
    setImage(img);
    setStep("templates");
  };

  const handleTemplateSelect = (t: ToolTemplate) => {
    setSelectedTemplate(t);
  };

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload a photo"); return; }
    const prompt = selectedTemplate?.prompt || customPrompt || "Change hairstyle";
    if (!hasEnoughCredits(1)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStep("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "hair-changer", image, prompt } });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); setStep("result"); }
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); setStep("templates"); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => {
          if (step === "upload") navigate("/images");
          else if (step === "custom") setStep("templates");
          else setStep("upload");
        }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1">Hair Changer</h1>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto pb-32">
        {step === "upload" && (
          <ImageUploadBox label="Upload your photo" image={image} onUpload={handleUpload} onClear={() => setImage(null)} />
        )}

        {step === "templates" && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-border/30">
              <img src={image!} alt="" className="w-full h-40 object-cover" />
            </div>
            {templates.length > 0 ? (
              <TemplateGrid
                templates={templates}
                onSelect={handleTemplateSelect}
                onCustom={() => setStep("custom")}
                customLabel="Custom Hairstyle"
              />
            ) : (
              <>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("custom")} className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center hover:border-primary/50 transition-colors">
                  <p className="text-sm font-semibold text-primary">Custom Hairstyle</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Describe your desired hairstyle</p>
                </motion.button>
                <p className="text-center text-muted-foreground text-sm py-4">No templates available yet</p>
              </>
            )}
          </div>
        )}

        {step === "custom" && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-border/30">
              <img src={image!} alt="" className="w-full h-40 object-cover" />
            </div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the hairstyle you want... e.g. 'Long blonde curly hair'"
              className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
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
            <div className="rounded-2xl overflow-hidden border border-border/20">
              <img src={resultUrl} alt="Result" className="w-full" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { const a = document.createElement("a"); a.href = resultUrl; a.download = "hair-result.png"; a.click(); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={() => { navigator.share?.({ url: resultUrl }).catch(() => { navigator.clipboard.writeText(resultUrl); toast.success("Copied!"); }); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
            <button onClick={() => { setResultUrl(null); setStep("templates"); setSelectedTemplate(null); setCustomPrompt(""); }} className="w-full py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium">Try Again</button>
          </div>
        )}
      </div>

      {((step === "templates" && selectedTemplate) || (step === "custom" && customPrompt.trim())) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerate} className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
            Generate · 1 MC
          </motion.button>
        </div>
      )}
    </div>
  );
};
export default HairChangerPage;
