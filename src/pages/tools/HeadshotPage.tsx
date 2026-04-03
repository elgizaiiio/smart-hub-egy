import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, UserRound, Sparkles, Download, Share2, Upload, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { ImageUploadBox } from "@/components/ToolPageLayout";

interface HeadshotTemplate { id: string; name: string; gender: string; prompt: string; preview_url: string | null; }

type Step = "browse" | "upload" | "generating" | "result";

const HeadshotPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [templates, setTemplates] = useState<HeadshotTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<HeadshotTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("browse");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("headshot_templates").select("*").eq("is_active", true).order("display_order").then(({ data }) => { if (data && data.length > 0) setTemplates(data as HeadshotTemplate[]); });
  }, []);

  const filteredTemplates = templates.filter(t => t.gender === "both" || t.gender === gender);

  const generateHeadshot = async () => {
    if (!uploadedImage || !selectedTemplate) return;
    if (!hasEnoughCredits(1)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStep("generating");
    try {
      const genderPrefix = gender === "male" ? "A handsome man" : "A beautiful woman";
      const fullPrompt = `${genderPrefix}, ${selectedTemplate.prompt}. Keep the exact facial features from the uploaded photo.`;
      const { data, error } = await supabase.functions.invoke("generate-image", { body: { prompt: fullPrompt, image: uploadedImage, model: "nano-banana", aspectRatio: "2:3" } });
      if (error) throw error;
      const url = data?.images?.[0] || data?.url;
      if (!url) throw new Error("No image generated");
      setResultUrl(url); setStep("result"); toast.success("Headshot generated!");
    } catch (e: any) { toast.error(e.message || "Generation failed"); setStep("upload"); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => navigate("/images")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-base font-semibold text-foreground flex-1">AI Headshot</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "browse" && (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pb-32">
              <div className="pt-4 pb-6 text-center">
                <h2 className="text-2xl font-bold text-foreground">Generate your perfect</h2>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">headshots</h2>
                <p className="text-sm text-muted-foreground mt-2">Choose a style and upload your photo</p>
              </div>
              <div className="flex gap-2 mb-6">
                <button onClick={() => setGender("female")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}><UserRound className="w-4 h-4" /> Female</button>
                <button onClick={() => setGender("male")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}><User className="w-4 h-4" /> Male</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map(t => (
                  <motion.button key={t.id} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedTemplate(t); setStep("upload"); }} className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left">
                    {t.preview_url ? <img src={t.preview_url} alt={t.name} className="w-full h-40 object-cover" /> : <div className="w-full h-40 bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center"><UserRound className="w-12 h-12 text-muted-foreground/20" /></div>}
                    <div className="p-3"><p className="text-sm font-semibold text-foreground">{t.name}</p></div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-4 space-y-4 pb-32">
              <div className="rounded-xl bg-accent/50 px-3 py-2"><p className="text-xs text-muted-foreground">Style: <span className="text-foreground font-medium">{selectedTemplate?.name}</span></p></div>
              <ImageUploadBox label="Upload your photo" image={uploadedImage} onUpload={setUploadedImage} onClear={() => setUploadedImage(null)} />
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }} className="relative">
                <Sparkles className="w-12 h-12 text-yellow-400" />
              </motion.div>
              <p className="text-sm text-muted-foreground animate-pulse">Generating your headshot...</p>
            </motion.div>
          )}

          {step === "result" && resultUrl && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-border/20"><img src={resultUrl} alt="Result" className="w-full" /></div>
              <div className="flex gap-3">
                <button onClick={() => { const a = document.createElement("a"); a.href = resultUrl; a.download = "headshot.png"; a.target = "_blank"; a.click(); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"><Download className="w-4 h-4" /> Download</button>
                <button onClick={() => { navigator.share?.({ url: resultUrl }).catch(() => { navigator.clipboard.writeText(resultUrl); toast.success("Link copied!"); }); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm"><Share2 className="w-4 h-4" /> Share</button>
              </div>
              <button onClick={generateHeadshot} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium"><RefreshCw className="w-4 h-4" /> Regenerate</button>
              <button onClick={() => { setStep("browse"); setResultUrl(null); setUploadedImage(null); setSelectedTemplate(null); }} className="w-full py-3 rounded-2xl bg-accent/30 text-foreground text-sm font-medium">Try Again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === "upload" && uploadedImage && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <motion.button whileTap={{ scale: 0.97 }} onClick={generateHeadshot} className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center shadow-lg shadow-yellow-500/20">Generate · 1 MC</motion.button>
        </div>
      )}
    </div>
  );
};
export default HeadshotPage;