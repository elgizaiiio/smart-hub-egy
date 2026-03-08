import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import FancyButton from "@/components/FancyButton";

// 3D perspective zoom grid — images fly toward the viewer on scroll
const gridItems = [
  { src: "/api-showcase/showcase-1.png", label: "AI Art" },
  { src: "/api-showcase/video-1.mp4", type: "video", label: "Motion" },
  { src: "/api-showcase/showcase-2.jpg", label: "Photography" },
  { src: "/api-showcase/showcase-3.jpg", label: "Design" },
  { src: "/api-showcase/showcase-4.jpg", label: "Concept" },
  { src: "/api-showcase/video-2.mp4", type: "video", label: "Animation" },
  { src: "/api-showcase/showcase-1.png", label: "Characters" },
  { src: "/api-showcase/video-3.mp4", type: "video", label: "Cinematic" },
  { src: "/api-showcase/showcase-2.jpg", label: "Editorial" },
  { src: "/api-showcase/showcase-4.jpg", label: "Branding" },
  { src: "/api-showcase/video-4.mp4", type: "video", label: "VFX" },
  { src: "/api-showcase/showcase-3.jpg", label: "Products" },
  { src: "/api-showcase/showcase-1.png", label: "Portraits" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "Shorts" },
  { src: "/api-showcase/showcase-2.jpg", label: "Landscapes" },
  { src: "/api-showcase/showcase-4.jpg", label: "Abstract" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Main perspective zoom
  const z = useTransform(scrollYProgress, [0, 1], [0, 2400]);
  const gridOpacity = useTransform(scrollYProgress, [0.6, 0.85], [1, 0]);
  const blur = useTransform(scrollYProgress, [0.55, 0.85], [0, 12]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.4]);

  return (
    <section ref={sectionRef} className="relative h-[400vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background">
        {/* Giant background text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden">
          <motion.span
            style={{ y: titleY, opacity: titleOpacity, scale: titleScale }}
            className="whitespace-nowrap font-display text-[22vw] font-black uppercase leading-none tracking-tighter text-primary/[0.07]"
          >
            MEGSY AI
          </motion.span>
        </div>

        {/* 3D Perspective Grid */}
        <motion.div
          style={{
            perspective: "1200px",
            opacity: gridOpacity,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            style={{
              translateZ: z,
              filter: blur.get() > 0 ? `blur(${blur.get()}px)` : undefined,
            }}
            className="grid h-[90vh] w-[90vw] max-w-[1400px] grid-cols-4 grid-rows-4 gap-3 md:gap-4"
          >
            {gridItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: i * 0.04, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/20"
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-3 left-4 text-xs font-bold uppercase tracking-wider text-foreground/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Center hero content */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="relative z-20 mx-auto max-w-5xl px-6 text-center"
        >
          <div className="rounded-3xl border border-border/30 bg-background/60 px-8 py-12 backdrop-blur-2xl md:px-16 md:py-16">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display text-[11vw] font-black uppercase leading-[0.82] tracking-tighter text-foreground md:text-[7vw]"
            >
              THE CREATOR
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-[11vw] font-black uppercase leading-[0.82] tracking-tighter text-primary md:text-[7vw]"
            >
              AI PLATFORM
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg"
            >
              80+ AI models. Images, videos, code, and chat. One platform for everything you create.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <FancyButton onClick={() => navigate("/auth")} className="px-10 py-4 text-lg">
                Start creating
              </FancyButton>
              <button
                onClick={() => document.getElementById("horizontal-gallery")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full border border-border bg-card/40 px-8 py-3.5 text-sm font-semibold text-foreground/90 transition-all hover:border-foreground/35 hover:bg-card"
              >
                Explore Platform
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Scroll to explore</span>
            <div className="h-8 w-5 rounded-full border-2 border-muted-foreground/40">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mx-auto mt-1 h-2 w-1 rounded-full bg-primary"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
