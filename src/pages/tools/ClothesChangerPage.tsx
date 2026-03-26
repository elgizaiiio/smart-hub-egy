import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, Loader2, Sparkles, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { CLOTHES_STYLES, FOOTBALL_CLUBS, getFootballPrompt } from "@/lib/imageToolsData";
import { ImageUploadBox } from "@/components/ToolPageLayout";

type Step = 'styles' | 'clubs' | 'upload' | 'result';

const ClothesChangerPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [step, setStep] = useState<Step>('styles');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<typeof FOOTBALL_CLUBS[0] | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    const style = CLOTHES_STYLES.find(s => s.id === styleId);
    if (styleId === 'football') setStep('clubs');
    else if (styleId === 'blank') { setCustomPrompt(""); setStep('upload'); }
    else setStep('upload');
  };

  const handleClubSelect = (club: typeof FOOTBALL_CLUBS[0]) => {
    setSelectedClub(club);
    setStep('upload');
  };

  const getPrompt = () => {
    if (selectedStyle === 'football' && selectedClub) return getFootballPrompt(selectedClub);
    if (selectedStyle === 'blank') return customPrompt;
    return CLOTHES_STYLES.find(s => s.id === selectedStyle)?.prompt || '';
  };

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload your photo"); return; }
    const prompt = getPrompt();
    if (!prompt) { toast.error("Please enter a description"); return; }
    if (!hasEnoughCredits(4)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "clothes-changer", image, prompt },
      });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); setStep('result'); }
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => step === 'styles' ? navigate(-1) : setStep(step === 'clubs' ? 'styles' : step === 'upload' ? (selectedStyle === 'football' ? 'clubs' : 'styles') : 'upload')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Clothes Changer</h1>
          <p className="text-xs text-muted-foreground">4 MC per generation</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto pb-32">
        {step === 'styles' && (
          <div className="grid grid-cols-2 gap-3">
            {CLOTHES_STYLES.map((style) => (
              <motion.button
                key={style.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStyleSelect(style.id)}
                className="rounded-2xl overflow-hidden border border-border/50 bg-card text-left"
              >
                {style.previewUrl ? (
                  <img src={style.previewUrl} alt={style.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-accent flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-sm font-medium text-foreground">{style.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {step === 'clubs' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground mb-3">Select a club</p>
            <div className="grid grid-cols-2 gap-2">
              {FOOTBALL_CLUBS.map((club) => (
                <button
                  key={club.name}
                  onClick={() => handleClubSelect(club)}
                  className="px-3 py-2.5 rounded-xl text-left text-sm bg-card border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <p className="font-medium text-foreground">{club.name}</p>
                  <p className="text-xs text-muted-foreground">{club.colors}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <ImageUploadBox label="Upload your photo" image={image} onUpload={setImage} onClear={() => setImage(null)} />
            {selectedStyle === 'blank' && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the outfit you want..."
                className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
            {selectedStyle === 'football' && selectedClub && (
              <div className="rounded-xl bg-accent/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Selected: <span className="text-foreground font-medium">{selectedClub.name}</span> ({selectedClub.colors})</p>
              </div>
            )}
            {selectedStyle && selectedStyle !== 'football' && selectedStyle !== 'blank' && (
              <div className="rounded-xl bg-accent/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Style: <span className="text-foreground font-medium">{CLOTHES_STYLES.find(s => s.id === selectedStyle)?.name}</span></p>
              </div>
            )}
          </div>
        )}

        {step === 'result' && resultUrl && (
          <div className="space-y-4">
            <img src={resultUrl} alt="Result" className="w-full rounded-2xl" />
            <div className="flex gap-3">
              <button onClick={() => { setResultUrl(null); setStep('upload'); }} className="flex-1 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">Try Again</button>
              <button onClick={() => { const a = document.createElement("a"); a.href = resultUrl; a.download = "clothes-result.png"; a.click(); }} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        )}
      </div>

      {step === 'upload' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20">
          <button onClick={handleGenerate} disabled={isGenerating || !image} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate · 4 MC</>}
          </button>
        </div>
      )}
    </div>
  );
};
export default ClothesChangerPage;
