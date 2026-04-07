import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Mic, Play, Pause, Check, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import VoiceStarLoader from "@/components/VoiceStarLoader";
import VoiceResultPlayer from "@/components/VoiceResultPlayer";
import { useCredits } from "@/hooks/useCredits";

const COST = 1;

const VoiceChangerPage = () => {
  const navigate = useNavigate();
  const { credits, userId, hasEnoughCredits } = useCredits();
  const [step, setStep] = useState<"upload" | "select-voice" | "confirm" | "loading" | "result">("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("voice_templates").select("*").eq("is_active", true).order("display_order").then(({ data }) => {
      if (data) setTemplates(data);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setStep("select-voice");
  };

  const togglePreview = (t: any) => {
    if (playingId === t.id) { audioRef.current?.pause(); setPlayingId(null); }
    else if (audioRef.current) { audioRef.current.src = t.audio_file_url; audioRef.current.play(); setPlayingId(t.id); }
  };

  const handleGenerate = async () => {
    if (!audioFile || !selectedTemplate || !userId) return;
    if (!hasEnoughCredits(COST)) { toast.error("Not enough credits"); return; }

    setStep("loading");
    try {
      // Deduct credits
      await supabase.functions.invoke("deduct-credits", {
        body: { user_id: userId, amount: COST, action_type: "voice_changer", description: "Voice Changer" }
      });

      const reader = new FileReader();
      reader.onload = async () => {
        const { data, error } = await supabase.functions.invoke("generate-voice", {
          body: { model_id: "voice-changer", prompt: reader.result, type: "tts", settings: { voice_ref: selectedTemplate.audio_file_url } },
        });
        if (error) throw error;
        if (data?.url) { setResultUrl(data.url); setStep("result"); toast.success("Voice changed!"); }
        else { toast.error("No audio returned"); setStep("confirm"); }
      };
      reader.readAsDataURL(audioFile);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setStep("confirm");
    }
  };

  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
            <h2 className="text-xl font-bold text-foreground mb-2">Upload Your Audio</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">Upload the audio file you want to change its voice</p>
            <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-sm py-16 rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
              <Upload className="w-8 h-8" />
              <p className="text-sm font-medium">Upload Audio File</p>
              <p className="text-xs text-muted-foreground/50">MP3, WAV, M4A</p>
            </button>
            <button onClick={() => toast("Recording coming soon")} className="w-full max-w-sm py-4 rounded-2xl bg-accent/30 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              <Mic className="w-4 h-4" /> Record Audio
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </div>
        );

      case "select-voice":
        return (
          <div className="px-4 pt-4">
            <h2 className="text-lg font-bold text-foreground mb-1">Choose Target Voice</h2>
            <p className="text-sm text-muted-foreground mb-4">Select a voice or upload your own</p>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedTemplate(t); setStep("confirm"); }}
                  className={`relative rounded-2xl overflow-hidden text-left p-3 border-2 transition-colors ${selectedTemplate?.id === t.id ? "border-primary" : "border-border/20"}`}
                  style={{ background: "hsl(var(--card))" }}
                >
                  {t.preview_image_url && <img src={t.preview_image_url} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    {selectedTemplate?.id === t.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePreview(t); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                    {playingId === t.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </motion.button>
              ))}
            </div>
            {templates.length === 0 && <p className="text-center text-muted-foreground/50 py-12 text-sm">No voice templates yet</p>}
          </div>
        );

      case "confirm":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">Ready to Transform</h2>
              <p className="text-sm text-muted-foreground">
                Voice: <span className="text-foreground font-medium">{selectedTemplate?.name}</span>
              </p>
              <p className="text-2xl font-bold text-primary mt-4">{COST} MC</p>
              <p className="text-xs text-muted-foreground mt-1">Your balance: {credits ?? 0} MC</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-bold text-sm"
            >
              Start Generation
            </motion.button>
            <button onClick={() => setStep("select-voice")} className="text-sm text-muted-foreground">Change voice</button>
          </div>
        );

      case "loading":
        return <VoiceStarLoader />;

      case "result":
        return (
          <div className="px-4 pt-4">
            {resultUrl && (
              <VoiceResultPlayer
                audioUrl={resultUrl}
                title="Voice Changed"
                onGenerateMore={() => navigate("/voice")}
              />
            )}
          </div>
        );
    }
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => {
            if (step === "upload") navigate("/voice");
            else if (step === "select-voice") setStep("upload");
            else if (step === "confirm") setStep("select-voice");
            else navigate("/voice");
          }} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground">Voice Changer</h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
        <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      </div>
    </AppLayout>
  );
};

export default VoiceChangerPage;
