import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const tabs = [
  {
    title: "AI CHAT",
    description: "Access GPT-5, DeepSeek R1, Claude, Gemini, and Megsy's own flagship chat model. Context-aware conversations with memory, file uploads, and real-time web search.",
    video: "/api-showcase/video-1.mp4",
    accent: "bg-emerald-500",
  },
  {
    title: "IMAGE GENERATION",
    description: "20+ image models including FLUX Kontext Max, Recraft V4, Ideogram 3, and Megsy V1. Professional-grade output for concept art, product shots, and brand assets.",
    video: "/api-showcase/video-2.mp4",
    accent: "bg-primary",
  },
  {
    title: "VIDEO CREATION",
    description: "Generate, animate, and render video with Kling 3.0 Pro, Veo 3.1, Runway Gen-4, and Megsy Video. From 4-second clips to full scenes with camera control.",
    video: "/api-showcase/video-3.mp4",
    accent: "bg-amber-500",
  },
  {
    title: "CODE & DEPLOY",
    description: "Write, preview, and deploy production-ready code. Live sandbox preview, GitHub integration, and one-click Vercel deployment.",
    video: "/api-showcase/video-4.mp4",
    accent: "bg-cyan-500",
  },
];

const StickyFeatureTabs = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const current = tabs[active];

  return (
    <section id="features" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-foreground md:text-6xl">
            WHAT YOU CAN <span className="text-primary">CREATE</span>
          </h2>
        </motion.div>

        {/* Tab buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                i === active
                  ? "bg-foreground text-background"
                  : "border border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-stretch">
          {/* Text side */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col justify-center"
            >
              <div className={`mb-4 h-1 w-12 rounded-full ${current.accent}`} />
              <h3 className="font-display text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
                {current.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                {current.description}
              </p>
              <div className="mt-8">
                <FancyButton onClick={() => navigate("/auth")} className="text-sm">
                  Try it now
                </FancyButton>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Video side */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/30">
            <AnimatePresence mode="wait">
              <motion.video
                key={active}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                src={current.video}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StickyFeatureTabs;
