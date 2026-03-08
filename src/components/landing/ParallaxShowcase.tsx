import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const parallaxItems = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video" as const, label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video" as const, label: "CINEMATIC" },
];

const INTERVAL = 4000;

const ParallaxShowcase = () => {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % parallaxItems.length);
    }, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []);

  const current = parallaxItems[active];

  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto mb-12 max-w-7xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-display text-[10vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[6vw]"
        >
          DEPTH OF{" "}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            CREATION
          </span>
        </motion.h2>
      </div>

      {/* Indicator dots */}
      <div className="mx-auto mb-6 flex items-center justify-center gap-2">
        {parallaxItems.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              setActive(i);
              clearInterval(timerRef.current);
              timerRef.current = setInterval(() => {
                setActive((prev) => (prev + 1) % parallaxItems.length);
              }, INTERVAL);
            }}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
              i === active
                ? "bg-foreground text-background"
                : "border border-border/40 text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Media container */}
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-border/40 bg-card/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              {current.type === "video" ? (
                <video
                  src={current.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={current.src}
                  alt={current.label}
                  className="h-full w-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Label overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="absolute left-6 top-6 z-10"
            >
              <span className="rounded-full bg-background/60 px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-foreground backdrop-blur-xl">
                {current.label}
              </span>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 right-6 z-10">
            <span className="font-display text-7xl font-black text-foreground/[0.05]">
              0{active + 1}
            </span>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-border/20">
            <motion.div
              key={active}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: INTERVAL / 1000, ease: "linear" }}
              className="h-full bg-primary/70"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParallaxShowcase;
