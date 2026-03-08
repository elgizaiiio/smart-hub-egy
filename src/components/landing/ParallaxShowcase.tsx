import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const parallaxItems: { src: string; type?: string; label: string }[] = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video", label: "CINEMATIC" },
];

const ParallaxShowcase = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % parallaxItems.length);
    }, 4000);
    return () => clearInterval(timer);
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

      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-border/40 bg-card/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 60, rotateY: 8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -60, rotateY: -8 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="h-full w-full"
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

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-border/20">
            <motion.div
              key={active}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
              className="h-full bg-primary/70"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParallaxShowcase;
