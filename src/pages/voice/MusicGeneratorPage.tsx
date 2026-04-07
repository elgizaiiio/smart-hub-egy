import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { motion, AnimatePresence } from "framer-motion";

const DURATIONS = [
  { label: "30s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "1.5 min", value: 90 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
];

const STYLES = ["Pop", "Rock", "Hip Hop", "Rap", "Jazz", "Classical", "Electronic", "Lo-Fi", "R&B", "Ambient"];

const HERO_TEXTS = [
  { line1: "Create", line2: "Music" },
  { line1: "AI", line2: "Composer" },
];

const LOADING_TEXTS = ["Composing your track...", "Layering melodies...", "Polishing the vibe..."];

const MusicGeneratorPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(60);
  const [style, setStyle] = useState("Pop");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ url: string; prompt: string }[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx((prev) => (prev + 1) % HERO_TEXTS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => setLoadingIdx((prev) => (prev + 1) % LOADING_TEXTS.length), 1800);
    return () => clearInterval(timer);
  }, [generating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const fullPrompt = `${prompt.trim()}. Style: ${style}. Duration: ${duration}s`;
      const { data, error } = await supabase.functions.invoke("generate-voice", {
        body: { model_id: "suno_music", prompt: fullPrompt, type: "music", settings: { duration } },
      });
      if (error) throw error;

      if (data?.status === "completed" && data?.url) {
        setResults(prev => [{ url: data.url, prompt: prompt.trim() }, ...prev]);
        toast.success("Music generated");
        setPrompt("");
        setGenerating(false);
        return;
      }

      if (data?.task_id) {
        // Client-side polling
        const taskId = data.task_id;
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const { data: pollData } = await supabase.functions.invoke("generate-voice", {
            body: { poll_task_id: taskId },
          });
          if (pollData?.status === "completed" && pollData?.url) {
            setResults(prev => [{ url: pollData.url, prompt: prompt.trim() }, ...prev]);
            toast.success("Music generated");
            setPrompt("");
            setGenerating(false);
            return;
          }
          if (pollData?.status === "failed") {
            throw new Error(pollData.error || "Generation failed");
          }
        }
        throw new Error("Generation timed out");
      }

      toast.error("No audio returned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setGenerating(false);
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => navigate("/voice")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={heroIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-bold">
                <span className="text-foreground">{HERO_TEXTS[heroIdx % HERO_TEXTS.length].line1} </span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx % HERO_TEXTS.length].line2}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-64">
          {results.map((r, i) => (
            <div key={i} className="rounded-2xl border border-border/20 bg-card/50 p-4 mb-3">
              <audio src={r.url} controls className="w-full" />
              <p className="text-xs text-muted-foreground mt-2 truncate">{r.prompt}</p>
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-center py-20 text-muted-foreground/50 text-sm">
              Describe the music you want to create
            </div>
          )}
          {generating && (
            <div className="rounded-3xl border border-border/20 bg-card/50 p-6 text-center space-y-4">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.15, 1] }}
                transition={{ rotate: { duration: 2.2, repeat: Infinity, ease: "linear" }, scale: { duration: 1.4, repeat: Infinity } }}
                className="mx-auto relative w-fit"
              >
                <Sparkles className="w-10 h-10 text-blue-400" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 blur-xl bg-blue-400/30 rounded-full" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.p key={loadingIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-sm font-medium text-foreground">{LOADING_TEXTS[loadingIdx]}</motion.p>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto space-y-3">
            {/* Duration picker - horizontal scroll chips */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-1 font-medium">Duration</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      d.value === duration
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-card/80 backdrop-blur-sm border border-border/30 text-foreground/70 hover:border-emerald-500/30"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style picker - horizontal scroll chips */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-1 font-medium">Style</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      s === style
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
                        : "bg-card/80 backdrop-blur-sm border border-border/30 text-foreground/70 hover:border-violet-500/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input bar */}
            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3 shadow-lg">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => { setPrompt(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder="Describe the music you want..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2 max-h-[120px]"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-20 transition-opacity"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MusicGeneratorPage;
