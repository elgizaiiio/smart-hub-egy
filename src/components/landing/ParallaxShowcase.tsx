import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useRef } from "react";

const parallaxItems: { src: string; type?: string; label: string }[] = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video", label: "CINEMATIC" },
];

const ParallaxShowcase = () => {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const index = Math.min(
      Math.floor(v * parallaxItems.length),
      parallaxItems.length - 1
    );
    setActive(index);
  });

  const current = parallaxItems[active];

  return (
    <section
      ref={sectionRef}
      style={{ height: `${parallaxItems.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="mx-auto mb-16 max-w-7xl px-6 text-center absolute top-8 left-0 right-0 z-10">
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
            {parallaxItems.map((item, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: i === active ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />
                )}
              </motion.div>
            ))}

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-border/20">
              <motion.div
                animate={{ width: `${((active + 1) / parallaxItems.length) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-primary/70"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParallaxShowcase;
