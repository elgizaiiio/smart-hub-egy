import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, ArrowUp, Download, Loader2, X, Mic, Music, Wand2, Volume2, AudioLines } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";

interface VoiceService {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  modelId: string;
  type: "tts" | "music";
  inputType: "text" | "audio";
  placeholder: string;
  badge?: "NEW" | "PRO";
  cost: number;
}

const VOICE_SERVICES: VoiceService[] = [
  {
    id: "clone-voice",
    title: "Clone Your Voice",
    description: "Record or upload 10s of audio to clone any voice",
    icon: <Mic className="w-5 h-5" />,
    modelId: "qwen3-tts-clone",
    type: "tts",
    inputType: "audio",
    placeholder: "Upload a voice sample to clone...",
    badge: "PRO",
    cost: 2,
  },
  {
    id: "text-to-speech",
    title: "Text to Speech",
    description: "Convert any text to natural-sounding speech",
    icon: <Volume2 className="w-5 h-5" />,
    modelId: "kokoro",
    type: "tts",
    inputType: "text",
    placeholder: "Enter text to convert to speech...",
    cost: 1,
  },
  {
    id: "voice-design",
    title: "Design AI Voice",
    description: "Create a unique custom AI voice from a description",
    icon: <Wand2 className="w-5 h-5" />,
    modelId: "qwen3-tts-design",
    type: "tts",
    inputType: "text",
    placeholder: "Describe the voice you want (e.g. warm female narrator)...",
    badge: "NEW",
    cost: 1,
  },
  {
    id: "music-generator",
    title: "AI Music Generator",
    description: "Describe a song and AI will compose it for you",
    icon: <Music className="w-5 h-5" />,
    modelId: "ace-step-turbo",
    type: "music",
    inputType: "text",
    placeholder: "Describe the music you want (genre, mood, instruments)...",
    badge: "NEW",
    cost: 2,
  },
  {
    id: "voice-changer",
    title: "Voice Changer",
    description: "Transform your voice with AI effects",
    icon: <AudioLines className="w-5 h-5" />,
    modelId: "qwen3-tts-custom",
    type: "tts",
    inputType: "audio",
    placeholder: "Upload audio to transform...",
    cost: 1,
  },
];

const VoicePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeService, setActiveService] = useState<VoiceService | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ url: string; service: string; prompt: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !activeService) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-voice", {
        body: { model_id: activeService.modelId, prompt: prompt.trim(), type: activeService.type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        setResults(prev => [{ url: data.url, service: activeService.title, prompt: prompt.trim() }, ...prev]);
        toast.success("Generation complete");
        setPrompt("");
      } else {
        toast.error("No audio returned");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    }
    setGenerating(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="voice" />

        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Voice & Music</h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-36">
          {/* Service Cards */}
          {!activeService ? (
            <div className="space-y-3 pt-4">
              {VOICE_SERVICES.map((service, i) => (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveService(service)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border/30 bg-card text-left hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{service.title}</p>
                      {service.badge && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${service.badge === "NEW" ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"}`}>
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{service.cost} MC</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="pt-4">
              {/* Active Service Header */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setActiveService(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {activeService.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">{activeService.title}</h2>
                  <p className="text-xs text-muted-foreground">{activeService.description}</p>
                </div>
              </div>

              {/* Results */}
              {results.filter(r => r.service === activeService.title).length > 0 && (
                <div className="space-y-3 mb-6">
                  {results.filter(r => r.service === activeService.title).map((r, i) => (
                    <div key={i} className="rounded-2xl border border-border/30 bg-card p-3">
                      <audio src={r.url} controls className="w-full" />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.prompt}</p>
                        <a href={r.url} download className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Results when no service selected */}
          {!activeService && results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Recent</h2>
              {results.map((r, i) => (
                <div key={i} className="rounded-2xl border border-border/30 bg-card p-3">
                  <audio src={r.url} controls className="w-full" />
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{r.service}</p>
                      <p className="text-xs text-muted-foreground/60 truncate max-w-[200px]">{r.prompt}</p>
                    </div>
                    <a href={r.url} download className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Input - Only when service is active */}
        {activeService && (
          <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-4 py-4 shadow-lg">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  placeholder={activeService.placeholder}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-3 max-h-[150px]"
                  style={{ minHeight: "48px" }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-colors"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VoicePage;
