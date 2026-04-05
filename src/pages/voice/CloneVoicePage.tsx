import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Mic, ArrowUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { motion, AnimatePresence } from "framer-motion";

const HERO_TEXTS = [
  { line1: "Clone Your", line2: "Voice" },
  { line1: "AI Voice", line2: "Twin" },
];

const CloneVoicePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "studio">("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ url: string; prompt: string }[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setStep("studio");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !audioFile) return;
    setGenerating(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const { data, error } = await supabase.functions.invoke("generate-voice", {
          body: { model_id: "qwen3-tts-clone", prompt: prompt.trim(), type: "tts", settings: { voice_sample: reader.result } },
        });
        if (error) throw error;
        if (data?.url) { setResults(prev => [{ url: data.url, prompt: prompt.trim() }, ...prev]); toast.success("Voice cloned"); setPrompt(""); }
        else toast.error("No audio returned");
        setGenerating(false);
      };
      reader.readAsDataURL(audioFile);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setGenerating(false);
    }
  };

  if (step === "upload") {
    return (
      <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
        <div className="h-full flex flex-col bg-background">
          <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
            <button onClick={() => navigate("/voice")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Clone Your Voice</h1>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-sm py-16 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8" />
              <p className="text-sm font-medium">Upload Voice Sample (10s+)</p>
            </button>
            <button onClick={() => toast("Recording coming soon")} className="w-full max-w-sm py-4 rounded-2xl bg-accent/50 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              <Mic className="w-4 h-4" />Record Audio
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => setStep("upload")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={heroIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-bold">
                <span className="text-foreground">{HERO_TEXTS[heroIdx % HERO_TEXTS.length].line1} </span>
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx % HERO_TEXTS.length].line2}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-36">
          {results.map((r, i) => (
            <div key={i} className="rounded-2xl border border-border/20 bg-card/50 p-3 mb-3">
              <audio src={r.url} controls className="w-full" />
              <p className="text-xs text-muted-foreground mt-2 truncate">{r.prompt}</p>
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-center py-20 text-muted-foreground/50 text-sm">Enter text to generate with your cloned voice</div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-lg">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => { setPrompt(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder="Enter text to speak with your voice..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2 max-h-[150px]"
              />
              <button onClick={handleGenerate} disabled={!prompt.trim() || generating} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-20">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CloneVoicePage;
