import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";

const parallaxItems: { src: string; type?: string; label: string }[] = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video", label: "CINEMATIC" },
];

const Card = ({ item, index, total, scrollYProgress }: { 
  item: typeof parallaxItems[0]; 
  index: number; 
  total: number;
  scrollYProgress: any;
}) => {
  const start = index / total;
  const end = (index + 1) / total;
  const mid = (start + end) / 2;

  // Card enters: scales from 0.7 to 1, y from 300 to 0, opacity 0 to 1
  const opacity = useTransform(scrollYProgress, [start, mid * 0.7 + start * 0.3], [0, 1]);
  const scale = useTransform(scrollYProgress, [start, mid], [0.7, 1]);
  const y = useTransform(scrollYProgress, [start, mid], [300, 0]);

  return (
    <motion.div
      style={{ opacity, scale, y, zIndex: index + 1 }}
      className="absolute inset-0"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl border border-border/40 bg-card/30 shadow-2xl shadow-background/50 md:rounded-[2rem]">
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
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </motion.div>
  );
};

const ParallaxShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={sectionRef}
      style={{ height: `${(parallaxItems.length + 1) * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="mb-8 text-center px-6">
          <h2 className="font-display text-[10vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[6vw]">
            DEPTH OF{" "}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              CREATION
            </span>
          </h2>
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-6 aspect-video">
          {parallaxItems.map((item, i) => (
            <Card
              key={i}
              item={item}
              index={i}
              total={parallaxItems.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ParallaxShowcase;
