import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

const parallaxItems = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video", label: "CINEMATIC" },
];

function ParallaxItem({ item, index }: { item: typeof parallaxItems[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);

  return (
    <motion.div
      ref={ref}
      style={{ y, scale, opacity }}
      className="relative mx-auto w-full max-w-5xl px-6"
    >
      <div className="group relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/20">
        {item.type === "video" ? (
          <video
            src={item.src}
            autoPlay
            loop
            muted
            playsInline
            className="aspect-[16/9] w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <img
            src={item.src}
            alt={item.label}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        )}

        {/* Floating label */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [40, -40]) }}
          className="absolute left-8 top-8"
        >
          <span className="rounded-full bg-background/60 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-foreground backdrop-blur-xl">
            {item.label}
          </span>
        </motion.div>

        <div className="absolute bottom-6 right-8">
          <span className="font-display text-8xl font-black text-foreground/[0.06]">
            0{index + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const ParallaxShowcase = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section className="relative py-32 md:py-48">
      <div className="mx-auto mb-20 max-w-7xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[8vw]"
        >
          DEPTH OF
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter md:text-[8vw]"
        >
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            CREATION
          </span>
        </motion.h2>
      </div>

      <div className="flex flex-col gap-32 md:gap-48">
        {parallaxItems.map((item, i) => (
          <ParallaxItem key={i} item={item} index={i} />
        ))}
      </div>

      {/* Fixed progress bar */}
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed bottom-0 left-0 right-0 z-50 h-1 bg-primary"
      />
    </section>
  );
};

export default ParallaxShowcase;
