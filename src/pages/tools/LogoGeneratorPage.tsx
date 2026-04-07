import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";

const STYLES = [
  { id: "minimal", label: "Minimal", desc: "Clean & simple" },
  { id: "bold", label: "Bold", desc: "Strong & impactful" },
  { id: "vintage", label: "Vintage", desc: "Retro & classic" },
  { id: "tech", label: "Tech", desc: "Modern & digital" },
  { id: "playful", label: "Playful", desc: "Fun & creative" },
  { id: "luxury", label: "Luxury", desc: "Premium & elegant" },
];

const LogoGeneratorPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [brandName, setBrandName] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandName.trim()) { toast.error("Enter your brand name"); return; }
    if (!hasEnoughCredits(2)) { toast.error("Insufficient credits"); return; }
    setIsGenerating(true);
    try {
      const prompt = `Design a ${style.id} style professional logo for a brand called "${brandName}". ${style.id === "minimal" ? "Use clean lines, minimal elements, modern sans-serif typography" : style.id === "bold" ? "Use strong typography, bold shapes, high contrast colors" : style.id === "vintage" ? "Use retro typography, worn textures, classic color palette" : style.id === "tech" ? "Use geometric shapes, gradient colors, modern futuristic font" : style.id === "playful" ? "Use rounded shapes, vibrant colors, fun typography" : "Use gold accents, serif font, premium sophisticated aesthetic"}. White background, vector-style, scalable.`;
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "logo-generator", prompt },
      });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => navigate("/images")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-base font-semibold text-foreground flex-1">AI Logo Generator</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-5">
        <AnimatePresence mode="wait">
          {resultUrl ? (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-border/20 bg-white p-4">
                <img src={resultUrl} alt="Logo" className="w-full" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const a = document.createElement("a"); a.href = resultUrl; a.download = `${brandName}-logo.png`; a.click(); }} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">Download</button>
                <button onClick={() => { navigator.clipboard.writeText(resultUrl); toast.success("Link copied!"); }} className="flex-1 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">Share</button>
              </div>
              <button onClick={() => setResultUrl(null)} className="w-full py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium">Try Again</button>
            </motion.div>
          ) : isGenerating ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground animate-pulse">Designing your logo...</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Brand Name</p>
                <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Enter your brand name..." className="w-full px-4 py-3.5 rounded-xl bg-accent/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s)} className={`py-3 rounded-xl text-center transition-all ${style.id === s.id ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"}`}>
                      <p className="text-xs font-medium">{s.label}</p>
                      <p className="text-[10px] opacity-70">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!resultUrl && !isGenerating && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerate} disabled={!brandName.trim()} className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center disabled:opacity-40 shadow-lg shadow-yellow-500/20">
            Generate Logo · 2 MC
          </motion.button>
        </div>
      )}
    </div>
  );
};
export default LogoGeneratorPage;
