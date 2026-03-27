import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, ArrowUp, Settings2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";

type Tab = "tts" | "music";

interface VoiceModel {
  id: string;
  name: string;
  provider: string;
  cost: number;
  badge?: "NEW" | "PRO";
  description: string;
}

const TTS_MODELS: VoiceModel[] = [
  { id: "qwen3-tts-custom", name: "Qwen3 TTS CustomVoice", provider: "deapi.ai", cost: 1, badge: "NEW", description: "Custom voice cloning with natural speech" },
  { id: "qwen3-tts-design", name: "Qwen3 TTS VoiceDesign", provider: "deapi.ai", cost: 1, badge: "NEW", description: "Design unique AI voices" },
  { id: "qwen3-tts-clone", name: "Qwen3 TTS VoiceClone", provider: "deapi.ai", cost: 2, badge: "PRO", description: "Clone any voice from a sample" },
  { id: "chatterbox", name: "Chatterbox", provider: "deapi.ai", cost: 1, description: "Fast and natural text-to-speech" },
  { id: "kokoro", name: "Kokoro", provider: "deapi.ai", cost: 1, description: "Expressive multilingual TTS" },
];

const MUSIC_MODELS: VoiceModel[] = [
  { id: "ace-step-turbo", name: "ACE-Step 1.5 Turbo", provider: "deapi.ai", cost: 2, badge: "NEW", description: "Fast AI music generation" },
  { id: "ace-step-base", name: "ACE-Step 1.5 Base", provider: "deapi.ai", cost: 1, description: "High quality AI music creation" },
];

const VoicePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("tts");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<VoiceModel | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ url: string; model: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const models = activeTab === "tts" ? TTS_MODELS : MUSIC_MODELS;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const model = selectedModel || models[0];
    setGenerating(true);
    toast.info(`Generating with ${model.name}...`);
    // TODO: integrate with edge function
    setTimeout(() => {
      toast.success("Generation complete");
      setGenerating(false);
    }, 3000);
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
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Voice & Music</h1>
            <div className="w-9" />
          </div>
          <div className="flex bg-accent/50 rounded-2xl p-1">
            <button onClick={() => setActiveTab("tts")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "tts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Text to Speech</button>
            <button onClick={() => setActiveTab("music")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "music" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Music</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-36">
          {/* Models grid */}
          <div className="pt-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Models</h2>
            <div className="space-y-2">
              {models.map(model => (
                <motion.button
                  key={model.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${selectedModel?.id === model.id ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card hover:border-border/50"}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {model.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{model.name}</p>
                      {model.badge && <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${model.badge === "NEW" ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"}`}>{model.badge}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{model.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{model.cost} MC</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Results</h2>
              {results.map((r, i) => (
                <div key={i} className="rounded-2xl border border-border/30 bg-card p-3">
                  <audio src={r.url} controls className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">{r.model}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Input Bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 py-3 shadow-lg">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder={activeTab === "tts" ? "Enter text to speak..." : "Describe the music you want..."}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2.5 max-h-[150px]"
                style={{ minHeight: "42px" }}
              />
              <button onClick={handleGenerate} disabled={!prompt.trim() || generating} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-colors">
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default VoicePage;
