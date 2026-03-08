import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const tabs = [
  {
    title: "AI CHAT",
    subtitle: "Converse with the most powerful language models",
    description: "Access GPT-5, DeepSeek R1, Claude, Gemini, and Megsy's own flagship chat model. Context-aware conversations with memory, file uploads, and real-time web search.",
    video: "/api-showcase/video-1.mp4",
    accent: "text-emerald-400",
    borderAccent: "border-emerald-500/30",
    bgAccent: "from-emerald-500/10",
  },
  {
    title: "IMAGE GENERATION",
    subtitle: "Create stunning visuals from text",
    description: "20+ image models including FLUX Kontext Max, Recraft V4, Ideogram 3, and Megsy V1. Professional-grade output for concept art, product shots, and brand assets.",
    video: "/api-showcase/video-2.mp4",
    accent: "text-purple-400",
    borderAccent: "border-purple-500/30",
    bgAccent: "from-purple-500/10",
  },
  {
    title: "VIDEO CREATION",
    subtitle: "Turn ideas into cinematic motion",
    description: "Generate, animate, and render video with Kling 3.0 Pro, Veo 3.1, Runway Gen-4, and Megsy Video. From 4-second clips to full scenes with camera control.",
    video: "/api-showcase/video-3.mp4",
    accent: "text-amber-400",
    borderAccent: "border-amber-500/30",
    bgAccent: "from-amber-500/10",
  },
  {
    title: "CODE & DEPLOY",
    subtitle: "Build full-stack apps with AI",
    description: "Write, preview, and deploy production-ready code. Live sandbox preview, GitHub integration, and one-click Vercel deployment. Full-stack React, Node, and more.",
    video: "/api-showcase/video-4.mp4",
    accent: "text-cyan-400",
    borderAccent: "border-cyan-500/30",
    bgAccent: "from-cyan-500/10",
  },
];

const StickyFeatureTabs = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress to active tab index
  const activeTabFloat = useTransform(scrollYProgress, [0, 1], [0, tabs.length - 0.01]);

  return (
    <section id="features" ref={sectionRef} className="relative" style={{ height: `${tabs.length * 150}vh` }}>
      <div className="sticky top-0 flex h-screen items-stretch overflow-hidden bg-background">
        {/* Left panel - tabs */}
        <div className="hidden w-[38%] flex-col justify-end p-8 lg:flex">
          <div className="relative flex-1">
            {tabs.map((tab, i) => {
              const TabContent = () => {
                // Each tab visible in its scroll range
                const start = i / tabs.length;
                const end = (i + 1) / tabs.length;
                const opacity = useTransform(
                  scrollYProgress,
                  [start, start + 0.05, end - 0.05, end],
                  [0, 1, 1, 0]
                );

                return (
                  <motion.div
                    style={{ opacity }}
                    className="absolute inset-0 flex flex-col justify-center"
                  >
                    <span className={`mb-4 font-display text-7xl font-black ${tab.accent} opacity-30`}>
                      0{i + 1}
                    </span>
                    <h3 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground xl:text-6xl">
                      {tab.title}
                    </h3>
                    <p className={`mt-3 text-lg font-semibold ${tab.accent}`}>
                      {tab.subtitle}
                    </p>
                    <div className={`my-5 h-px w-full bg-border/50`} />
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {tab.description}
                    </p>
                    <div className="mt-8 flex gap-4">
                      <FancyButton onClick={() => navigate("/auth")} className="text-sm">
                        Try it now
                      </FancyButton>
                      <button
                        onClick={() => navigate("/auth")}
                        className="rounded-full border border-border bg-card/30 px-6 py-2.5 text-sm font-medium text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground"
                      >
                        Learn more
                      </button>
                    </div>
                  </motion.div>
                );
              };
              return <TabContent key={i} />;
            })}
          </div>

          {/* Tab indicators */}
          <div className="flex gap-2 pb-6">
            {tabs.map((tab, i) => {
              const Dot = () => {
                const start = i / tabs.length;
                const end = (i + 1) / tabs.length;
                const width = useTransform(
                  scrollYProgress,
                  [start, start + 0.05, end - 0.05, end],
                  [8, 40, 40, 8]
                );
                const bg = useTransform(
                  scrollYProgress,
                  [start, start + 0.05, end - 0.05, end],
                  ["hsl(var(--border))", "hsl(var(--primary))", "hsl(var(--primary))", "hsl(var(--border))"]
                );
                return (
                  <motion.div
                    style={{ width, backgroundColor: bg }}
                    className="h-2 rounded-full"
                  />
                );
              };
              return <Dot key={i} />;
            })}
          </div>
        </div>

        {/* Right panel - video */}
        <div className="relative flex-1 overflow-hidden rounded-tl-[2rem] rounded-bl-[2rem] lg:rounded-bl-[2rem]">
          {tabs.map((tab, i) => {
            const VideoPanel = () => {
              const start = i / tabs.length;
              const end = (i + 1) / tabs.length;
              const opacity = useTransform(
                scrollYProgress,
                [start, start + 0.06, end - 0.06, end],
                [0, 1, 1, 0]
              );
              const y = useTransform(
                scrollYProgress,
                [start, start + 0.08],
                ["8%", "0%"]
              );

              return (
                <motion.div
                  style={{ opacity, y }}
                  className="absolute inset-0"
                >
                  <video
                    src={tab.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/50" />

                  {/* Mobile overlay text */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-6 pt-20 lg:hidden">
                    <span className={`text-sm font-bold uppercase tracking-widest ${tab.accent}`}>
                      0{i + 1}
                    </span>
                    <h3 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tight text-foreground">
                      {tab.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tab.description}
                    </p>
                    <FancyButton onClick={() => navigate("/auth")} className="mt-4 text-sm">
                      Try it now
                    </FancyButton>
                  </div>
                </motion.div>
              );
            };
            return <VideoPanel key={i} />;
          })}
        </div>
      </div>
    </section>
  );
};

export default StickyFeatureTabs;
