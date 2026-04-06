import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, Mic, Music, Volume2, AudioLines, Phone } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import silkCard1 from "@/assets/silk-card-1.webp";
import silkCard2 from "@/assets/silk-card-2.jpg";
import silkCard3 from "@/assets/silk-card-3.webp";

interface VoiceService {
  id: string;
  title: string;
  route: string;
  icon: React.ReactNode;
  image?: string;
}

const VOICE_SERVICES: VoiceService[] = [
  {
    id: "voice-changer",
    title: "Voice Changer",
    route: "/voice/changer",
    icon: <AudioLines className="w-5 h-5" />,
    image: undefined, // will use silkCard1
  },
  {
    id: "clone-voice",
    title: "Clone Voice",
    route: "/voice/clone",
    icon: <Mic className="w-5 h-5" />,
    image: undefined, // will use silkCard2
  },
  {
    id: "text-to-speech",
    title: "Text to Speech",
    route: "/voice/tts",
    icon: <Volume2 className="w-5 h-5" />,
    image: undefined, // will use silkCard3
  },
];

const BOTTOM_SERVICES = [
  {
    id: "music-generator",
    title: "Music Generator",
    route: "/voice/music",
    icon: <Music className="w-5 h-5" />,
  },
];

// Silk gradient palettes for bottom cards
const SILK_PALETTES = [
  { bg: "linear-gradient(135deg, #1e3a5f 0%, #7c3aed 40%, #a21caf 100%)", s1: "rgba(167,139,250,0.5)", s2: "rgba(192,38,211,0.4)" },
];

const HERO_TEXTS = [
  { line1: "AI Voice", line2: "Tools" },
  { line1: "Smart", line2: "Audio" },
  { line1: "Create", line2: "Sound" },
];

const VoicePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(p => (p + 1) % HERO_TEXTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const hero = HERO_TEXTS[heroIdx];
  const silkImages = [silkCard1, silkCard2, silkCard3];

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

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {/* Hero Text - 2 words top, 1 word bottom */}
          <div className="pt-4 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-2xl font-extrabold text-foreground leading-tight">{hero.line1}</p>
                <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent leading-tight">{hero.line2}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Priority actions */}
          <div className="space-y-3 mb-4">
            {BOTTOM_SERVICES.map((service) => {
              const silk = SILK_PALETTES[0];
              return (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(service.route)}
                  className="w-full h-28 relative overflow-hidden rounded-2xl text-left"
                  style={{ background: silk.bg }}
                >
                  <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 150% 100% at 15% 25%, ${silk.s1}, transparent 70%), radial-gradient(ellipse 130% 90% at 85% 75%, ${silk.s2}, transparent 65%)` }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(255,255,255,0.04) 60%, transparent 100%)` }} />
                  <div className="relative h-full flex items-center px-5 gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                      {service.icon}
                    </div>
                    <p className="text-base font-bold text-white">{service.title}</p>
                  </div>
                </motion.button>
              );
            })}

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/voice/call")}
              className="w-full h-28 relative overflow-hidden rounded-2xl text-left"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #3b82f6 100%)" }}
            >
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 150% 100% at 15% 25%, rgba(59,130,246,0.4), transparent 70%), radial-gradient(ellipse 130% 90% at 85% 75%, rgba(99,102,241,0.3), transparent 65%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(255,255,255,0.04) 60%, transparent 100%)" }} />
              <div className="relative h-full flex items-center px-5 gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Call with AI</p>
                  <p className="text-xs text-white/50 mt-0.5">Talk naturally with Megsy</p>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Top 3 Cards with silk images - half image, half silk gradient */}
          <div className="space-y-3 mb-4">
            {VOICE_SERVICES.map((service, i) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(service.route)}
                className="w-full h-36 relative overflow-hidden rounded-2xl text-left flex"
                style={{ background: "#000" }}
              >
                {/* Left half - silk image */}
                <div className="w-1/2 h-full relative overflow-hidden">
                  <img src={silkImages[i]} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Right half - dark with silk gradient overlay */}
                <div className="w-1/2 h-full relative flex flex-col justify-center px-4"
                  style={{ background: `linear-gradient(135deg, hsl(0, 0%, 6%) 0%, hsl(0, 0%, 4%) 100%)` }}
                >
                  <div className="absolute inset-0 opacity-30"
                    style={{ background: `radial-gradient(ellipse 120% 100% at 0% 50%, rgba(139,92,246,0.4), transparent 70%)` }}
                  />
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/70 mb-2">
                      {service.icon}
                    </div>
                    <p className="text-sm font-bold text-white">{service.title}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default VoicePage;
