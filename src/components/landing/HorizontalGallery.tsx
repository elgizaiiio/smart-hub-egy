import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const galleryItems = [
  { src: "/api-showcase/showcase-1.png", type: "image" as const, label: "MEGSY V1 IMAGE", color: "from-purple-500/40" },
  { src: "/api-showcase/video-1.mp4", type: "video" as const, label: "MEGSY VIDEO", color: "from-emerald-500/40" },
  { src: "/api-showcase/showcase-2.jpg", type: "image" as const, label: "FLUX KONTEXT MAX", color: "from-amber-500/40" },
  { src: "/api-showcase/video-2.mp4", type: "video" as const, label: "KLING 3.0 PRO", color: "from-rose-500/40" },
  { src: "/api-showcase/showcase-3.jpg", type: "image" as const, label: "RECRAFT V4", color: "from-cyan-500/40" },
  { src: "/api-showcase/video-3.mp4", type: "video" as const, label: "VEO 3.1", color: "from-fuchsia-500/40" },
  { src: "/api-showcase/showcase-4.jpg", type: "image" as const, label: "IDEOGRAM 3", color: "from-orange-500/40" },
  { src: "/api-showcase/video-4.mp4", type: "video" as const, label: "RUNWAY GEN-4", color: "from-blue-500/40" },
];

const ITEM_WIDTH = 420;
const GAP = 24;

const HorizontalGallery = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const totalDistance = (galleryItems.length - 1) * (ITEM_WIDTH + GAP);
  const x = useTransform(scrollYProgress, [0, 1], [0, -totalDistance]);

  return (
    <section id="horizontal-gallery" ref={containerRef} className="relative h-[400vh] bg-background">
      {/* Sticky horizontal scroller */}
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* Section header */}
        <div className="mb-8 px-8 md:px-16">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-display text-[10vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[6vw]"
          >
            MODEL SHOWCASE
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-3 max-w-lg text-lg text-muted-foreground"
          >
            Scroll through our most powerful AI models — each built for a different creative discipline.
          </motion.p>
        </div>

        {/* Gallery track */}
        <div className="relative overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-6 pl-8 md:pl-16"
          >
            {galleryItems.map((item, i) => (
              <motion.div
                key={i}
                className="group relative flex-shrink-0 overflow-hidden rounded-3xl border border-border/50 bg-card/20"
                style={{ width: ITEM_WIDTH, height: "55vh", minHeight: 380 }}
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.4 }}
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

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${item.color} to-transparent opacity-40`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="mb-2 inline-block rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground/60 backdrop-blur-md">
                    0{i + 1}
                  </span>
                  <p className="font-display text-2xl font-black uppercase tracking-tight text-foreground">
                    {item.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll progress bar */}
        <div className="mx-8 mt-8 md:mx-16">
          <motion.div className="h-1 overflow-hidden rounded-full bg-border/40">
            <motion.div
              style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
              className="h-full bg-primary"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalGallery;
