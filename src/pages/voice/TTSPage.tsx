import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Loader2, Play, Pause, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";

const TTSPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"select-voice" | "input">("select-voice");
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.from("tts_voices").select("*").eq("is_active", true).order("display_order").then(({ data }) => {
      if (data) setVoices(data);
    });
  }, []);

  const togglePreview = (voice: any) => {
    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = voice.preview_audio_url;
        audioRef.current.play();
        setPlayingId(voice.id);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedVoice) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-voice", {
        body: { model_id: "kokoro", prompt: prompt.trim(), type: "tts", settings: { voice_id: selectedVoice.voice_id } },
      });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); toast.success("Speech generated"); }
      else toast.error("No audio returned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setGenerating(false);
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => step === "select-voice" ? navigate("/voice") : setStep("select-voice")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-bold text-foreground">Text to Speech</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {step === "select-voice" && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">Choose a voice</p>
              <div className="grid grid-cols-2 gap-3">
                {voices.map((v) => (
                  <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedVoice(v)}
                    className={`relative rounded-2xl overflow-hidden text-left p-4 border-2 transition-colors ${selectedVoice?.id === v.id ? "border-primary" : "border-border/20"}`}
                    style={{ background: "hsl(0, 0%, 8%)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">{v.name}</p>
                      {selectedVoice?.id === v.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); togglePreview(v); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                      {playingId === v.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                  </motion.button>
                ))}
              </div>
              {voices.length === 0 && <p className="text-center text-muted-foreground/50 py-12 text-sm">No voices available yet</p>}

              {selectedVoice && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep("input")}
                  className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm"
                >
                  Next
                </motion.button>
              )}
            </div>
          )}

          {step === "input" && (
            <div className="pt-4 space-y-4">
              <div className="px-3 py-2 rounded-xl bg-accent/30 text-xs text-muted-foreground">
                Voice: <span className="text-foreground font-medium">{selectedVoice?.name}</span>
              </div>

              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                rows={6}
                className="w-full rounded-2xl border border-border/30 bg-card/50 p-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
              />

              {resultUrl && (
                <div className="rounded-2xl border border-border/20 bg-card/50 p-3">
                  <audio src={resultUrl} controls className="w-full" />
                  <div className="flex gap-2 mt-2">
                    <a href={resultUrl} download className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs text-center font-medium">Download</a>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                {generating ? "Generating..." : "Generate - 1 MC"}
              </button>
            </div>
          )}
        </div>
        <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      </div>
    </AppLayout>
  );
};

export default TTSPage;
