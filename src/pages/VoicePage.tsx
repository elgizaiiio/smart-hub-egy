import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Mic, Music, Volume2, AudioLines, Phone, Eraser, Languages, LayoutGrid, Disc3 } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import voiceChangerHero from "@/assets/voice-changer-hero.jpg";
import cloneVoiceHero from "@/assets/clone-voice-hero.jpg";
import ttsHero from "@/assets/tts-hero.jpg";
import noiseRemoverHero from "@/assets/noise-remover-hero.jpg";
import voiceTranslateHero from "@/assets/voice-translate-hero.jpg";

const HERO_PHRASES = [
  "Transform your voice with AI-powered tools",
  "Create music, clone voices, and more",
  "Your personal AI audio studio awaits",
  "Turn text into natural speech instantly",
  "AI voice cloning in seconds",
  "Generate music from your imagination",
  "Professional voice tools at your fingertips",
  "Real-time AI voice conversations",
  "Change any voice to any style",
  "Remove noise from any audio file",
  "Create voiceovers like a pro",
  "AI-powered speech synthesis engine",
  "Clone any voice with a short sample",
  "Generate cinematic soundtracks instantly",
  "Talk to AI naturally in any language",
  "Transform recordings with one click",
  "Studio-quality audio processing by AI",
  "Create podcasts with AI voices",
  "Generate audiobooks from text instantly",
  "AI music that sounds human-made",
  "Professional noise removal in seconds",
  "Voice effects powered by deep learning",
  "Multilingual text-to-speech engine",
  "Create unique sound effects with AI",
  "Real-time voice transformation technology",
  "AI-powered audio enhancement suite",
  "Generate natural speech in 50+ languages",
  "Clone celebrity voices ethically with AI",
  "Create custom AI voice assistants",
  "Professional dubbing with voice cloning",
  "AI audio mastering and enhancement",
  "Generate ambient music for any mood",
  "Voice-to-voice translation in real-time",
  "Create song covers with AI voices",
  "Professional audio restoration by AI",
  "Generate jingles and intros with AI",
  "AI-powered speech coaching and analysis",
  "Create ASMR content with AI voices",
  "Generate radio-quality voiceovers",
  "AI music composition for any genre",
  "Remove echo and reverb from recordings",
  "Create meditation guides with AI voice",
  "AI-powered karaoke voice separation",
  "Generate voice messages in any accent",
  "Professional speech enhancement tools",
  "Create AI voice characters for games",
  "Generate background music for videos",
  "AI-powered audio transcription engine",
  "Create voice filters and effects",
  "Real-time language translation via voice",
];

const PRIORITY_SERVICES = [
  { id: "call-ai", title: "Call with AI", description: "Talk naturally with Megsy", route: "/voice/call", icon: <Phone className="w-5 h-5" />, gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #3b82f6 100%)", glow: "rgba(59,130,246,0.4)" },
  { id: "music", title: "Music Generator", description: "Create AI music from text", route: "/voice/music", icon: <Music className="w-5 h-5" />, gradient: "linear-gradient(135deg, #1e3a5f 0%, #7c3aed 40%, #a21caf 100%)", glow: "rgba(167,139,250,0.5)" },
];

const TOOL_SERVICES = [
  { id: "voice-changer", title: "Voice Changer", route: "/voice/changer", icon: <AudioLines className="w-5 h-5" />, image: voiceChangerHero },
  { id: "clone-voice", title: "Clone Voice", route: "/voice/clone", icon: <Mic className="w-5 h-5" />, image: cloneVoiceHero },
  { id: "tts", title: "Text to Speech", route: "/voice/tts", icon: <Volume2 className="w-5 h-5" />, image: ttsHero },
  { id: "noise-remover", title: "Noise Remover", route: "/voice/noise-remover", icon: <Eraser className="w-5 h-5" />, image: noiseRemoverHero },
  { id: "voice-translate", title: "Voice Translation", route: "/voice/translate", icon: <Languages className="w-5 h-5" />, image: voiceTranslateHero },
];

const VoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(p => (p + 1) % HERO_PHRASES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="voice" />

        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <div className="w-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {/* Hero - blue gradient text like landing */}
          <div className="pt-4 pb-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={heroIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="text-lg font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-snug"
              >
                {HERO_PHRASES[heroIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Priority: Call + Music */}
          <div className="space-y-3 mb-4">
            {PRIORITY_SERVICES.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(s.route)}
                className="w-full h-28 relative overflow-hidden rounded-2xl text-left"
                style={{ background: s.gradient }}
              >
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 150% 100% at 15% 25%, ${s.glow}, transparent 70%)` }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%)" }} />
                <div className="relative h-full flex items-center px-5 gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80">{s.icon}</div>
                  <div>
                    <p className="text-base font-bold text-white">{s.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{s.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Tool cards with hero images */}
          <div className="space-y-3">
            {TOOL_SERVICES.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(s.route)}
                className="w-full h-32 relative overflow-hidden rounded-2xl text-left flex"
                style={{ background: "hsl(var(--card))" }}
              >
                <div className="w-1/2 h-full relative overflow-hidden">
                  <img src={s.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="w-1/2 h-full relative flex flex-col justify-center px-4" style={{ background: "hsl(var(--card))" }}>
                  <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse 120% 100% at 0% 50%, rgba(59,130,246,0.4), transparent 70%)" }} />
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground mb-2">{s.icon}</div>
                    <p className="text-sm font-bold text-foreground">{s.title}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-t border-border/30">
          <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
            <button
              onClick={() => navigate("/voice")}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${location.pathname === "/voice" ? "text-primary" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
              onClick={() => navigate("/voice/studio")}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${location.pathname === "/voice/studio" ? "text-primary" : "text-muted-foreground"}`}
            >
              <Disc3 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Studio</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default VoicePage;
