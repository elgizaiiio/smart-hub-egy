import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import FancyButton from "@/components/FancyButton";

const gridItems = [
  { src: "/api-showcase/showcase-1.png", type: "image" as const },
  { src: "/api-showcase/video-1.mp4", type: "video" as const },
  { src: "/api-showcase/showcase-2.jpg", type: "image" as const },
  { src: "/api-showcase/showcase-3.jpg", type: "image" as const },
  { src: "/api-showcase/showcase-4.jpg", type: "image" as const },
  { src: "/api-showcase/video-2.mp4", type: "video" as const },
  { src: "/api-showcase/showcase-1.png", type: "image" as const },
  { src: "/api-showcase/video-3.mp4", type: "video" as const },
  { src: "/api-showcase/showcase-2.jpg", type: "image" as const },
  { src: "/api-showcase/showcase-4.jpg", type: "image" as const },
  { src: "/api-showcase/video-4.mp4", type: "video" as const },
  { src: "/api-showcase/showcase-3.jpg", type: "image" as const },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const gridScale = useTransform(scrollYProgress, [0, 1], [1, 2.2]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [0.35, 0.15, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-background pt-20">
      {/* Background grid of media - fills the screen */}
      <motion.div
        style={{ scale: gridScale, opacity: gridOpacity }}
        className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-2 p-2 md:grid-cols-4 md:grid-rows-3"
      >
        {gridItems.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-xl">
            {item.type === "video" ? (
              <video src={item.src} autoPlay loop muted playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={item.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Center hero content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-6"
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-[13vw] font-black uppercase leading-[0.82] tracking-tighter text-foreground md:text-[8vw]"
          >
            THE CREATOR
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-[13vw] font-black uppercase leading-[0.82] tracking-tighter text-primary md:text-[8vw]"
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
              className="rounded-full border border-border bg-card/40 px-8 py-3.5 text-sm font-semibold text-foreground/90 backdrop-blur-md transition-all hover:border-foreground/35 hover:bg-card"
            >
              Explore Platform
            </button>
          </motion.div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
