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

const ITEM_WIDTH = 380;
const GAP = 20;

const HorizontalGallery = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const totalDistance = (galleryItems.length - 1) * (ITEM_WIDTH + GAP);
  const x = useTransform(scrollYProgress, [0, 1], [0, -totalDistance]);

  return (
    <section id="horizontal-gallery" ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden bg-background">
        {/* Header */}
        <div className="mb-6 px-6 md:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-display text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[5vw]"
          >
            MODEL SHOWCASE
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 max-w-md text-base text-muted-foreground"
          >
            Scroll through our most powerful AI models.
          </motion.p>
        </div>

        {/* Gallery track */}
        <div className="overflow-hidden">
          <motion.div style={{ x }} className="flex gap-5 pl-6 md:pl-12">
            {galleryItems.map((item, i) => (
              <motion.div
                key={i}
                className="group relative flex-shrink-0 overflow-hidden rounded-2xl border border-border/40"
                style={{ width: ITEM_WIDTH, height: "58vh", minHeight: 340 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    0{i + 1}
                  </span>
                  <p className="font-display text-xl font-black uppercase tracking-tight text-foreground">
                    {item.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="mx-6 mt-6 md:mx-12">
          <div className="h-0.5 overflow-hidden rounded-full bg-border/30">
            <motion.div
              style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalGallery;
