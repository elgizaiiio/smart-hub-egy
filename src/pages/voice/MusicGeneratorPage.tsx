import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Loader2, ChevronDown, Clock, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { motion, AnimatePresence } from "framer-motion";

const DURATIONS = ["30s", "60s", "90s", "120s", "180s"];
const STYLES = ["Pop", "Rock", "Hip Hop", "Rap", "Jazz", "Classical", "Electronic", "Lo-Fi", "R&B", "Ambient"];

const HERO_TEXTS = [
  { line1: "Create", line2: "Music" },
  { line1: "AI", line2: "Composer" },
];

const MusicGeneratorPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("60s");
  const [style, setStyle] = useState("Pop");
  const [showDuration, setShowDuration] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ url: string; prompt: string }[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const fullPrompt = `${prompt.trim()}. Style: ${style}. Duration: ${duration}`;
      const { data, error } = await supabase.functions.invoke("generate-voice", {
        body: { model_id: "ace-step-turbo", prompt: fullPrompt, type: "music", settings: { duration: parseInt(duration) } },
      });
      if (error) throw error;
      if (data?.url) { setResults(prev => [{ url: data.url, prompt: prompt.trim() }, ...prev]); toast.success("Music generated"); setPrompt(""); }
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
          <button onClick={() => navigate("/voice")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={heroIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-bold">
                <span className="text-foreground">{HERO_TEXTS[heroIdx % HERO_TEXTS.length].line1} </span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx % HERO_TEXTS.length].line2}</span>
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
            <div className="text-center py-20 text-muted-foreground/50 text-sm">Describe the music you want to create</div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto space-y-2">
            {/* Picker pills */}
            <div className="flex gap-2 px-1">
              <div className="relative">
                <button onClick={() => { setShowDuration(!showDuration); setShowStyle(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/30 text-xs text-foreground">
                  <Clock className="w-3 h-3" />{duration}<ChevronDown className="w-3 h-3" />
                </button>
                {showDuration && (
                  <div className="absolute bottom-full mb-1 left-0 bg-card border border-border/30 rounded-xl p-1 shadow-lg z-10">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => { setDuration(d); setShowDuration(false); }} className={`block w-full text-left px-3 py-1.5 rounded-lg text-xs ${d === duration ? "text-primary font-medium" : "text-foreground/70"} hover:bg-accent/50`}>{d}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => { setShowStyle(!showStyle); setShowDuration(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/30 text-xs text-foreground">
                  <Music className="w-3 h-3" />{style}<ChevronDown className="w-3 h-3" />
                </button>
                {showStyle && (
                  <div className="absolute bottom-full mb-1 left-0 bg-card border border-border/30 rounded-xl p-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                    {STYLES.map(s => (
                      <button key={s} onClick={() => { setStyle(s); setShowStyle(false); }} className={`block w-full text-left px-3 py-1.5 rounded-lg text-xs ${s === style ? "text-primary font-medium" : "text-foreground/70"} hover:bg-accent/50`}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-lg">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => { setPrompt(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder="Describe the music you want..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2 max-h-[150px]"
              />
              <button onClick={handleGenerate} disabled={!prompt.trim() || generating} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-20">
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
