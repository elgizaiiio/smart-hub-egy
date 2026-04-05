import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Mic, Loader2, ArrowUp, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";

const VoiceChangerPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "select-voice" | "result">("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
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
    setAudioUrl(URL.createObjectURL(file));
    setStep("select-voice");
  };

  const handleRecord = () => {
    toast("Recording feature coming soon");
  };

  const togglePreview = (template: any) => {
    if (playingId === template.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = template.audio_file_url;
        audioRef.current.play();
        setPlayingId(template.id);
      }
    }
  };

  const handleGenerate = async () => {
    if (!audioFile || !selectedTemplate) return;
    setGenerating(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const { data, error } = await supabase.functions.invoke("generate-voice", {
          body: { model_id: "qwen3-tts-custom", prompt: reader.result, type: "tts", settings: { voice_ref: selectedTemplate.audio_file_url } },
        });
        if (error) throw error;
        if (data?.url) { setResultUrl(data.url); setStep("result"); toast.success("Voice changed successfully"); }
        else toast.error("No audio returned");
        setGenerating(false);
      };
      reader.readAsDataURL(audioFile);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
      setGenerating(false);
    }
  };

  if (step === "result" && resultUrl) {
    return (
      <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
        <div className="h-full flex flex-col bg-background">
          <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
            <button onClick={() => navigate("/voice")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Result</h1>
          </div>
          <div className="flex-1 px-4 py-6 space-y-4">
            <audio src={resultUrl} controls className="w-full" />
            <div className="flex gap-3">
              <a href={resultUrl} download className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm text-center">Download</a>
              <button onClick={() => { setStep("upload"); setResultUrl(null); setAudioFile(null); }} className="flex-1 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">New Voice</button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => step === "upload" ? navigate("/voice") : setStep("upload")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-bold text-foreground">Voice Changer</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-sm py-16 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                <Upload className="w-8 h-8" />
                <p className="text-sm font-medium">Upload Audio File</p>
              </button>
              <button onClick={handleRecord} className="w-full max-w-sm py-4 rounded-2xl bg-accent/50 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                <Mic className="w-4 h-4" />
                Record Audio
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {step === "select-voice" && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">Select a voice template</p>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <motion.button
                    key={t.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedTemplate(t)}
                    className={`relative rounded-2xl overflow-hidden text-left p-3 border-2 transition-colors ${selectedTemplate?.id === t.id ? "border-primary" : "border-border/20"}`}
                    style={{ background: "hsl(0, 0%, 8%)" }}
                  >
                    {t.preview_image_url && <img src={t.preview_image_url} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />}
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); togglePreview(t); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                      {playingId === t.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                  </motion.button>
                ))}
              </div>
              {templates.length === 0 && <p className="text-center text-muted-foreground/50 py-12 text-sm">No voice templates yet</p>}

              {selectedTemplate && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  {generating ? "Generating..." : "Generate - 1 MC"}
                </motion.button>
              )}
            </div>
          )}
        </div>
        <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      </div>
    </AppLayout>
  );
};

export default VoiceChangerPage;
