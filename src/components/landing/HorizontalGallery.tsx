import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const galleryItems = [
  { src: "/api-showcase/showcase-1.png", type: "image" as const, label: "MEGSY V1 IMAGE" },
  { src: "/api-showcase/video-1.mp4", type: "video" as const, label: "MEGSY VIDEO" },
  { src: "/api-showcase/showcase-2.jpg", type: "image" as const, label: "FLUX KONTEXT MAX" },
  { src: "/api-showcase/video-2.mp4", type: "video" as const, label: "KLING 3.0 PRO" },
  { src: "/api-showcase/showcase-3.jpg", type: "image" as const, label: "RECRAFT V4" },
  { src: "/api-showcase/video-3.mp4", type: "video" as const, label: "VEO 3.1" },
  { src: "/api-showcase/showcase-4.jpg", type: "image" as const, label: "IDEOGRAM 3" },
  { src: "/api-showcase/video-4.mp4", type: "video" as const, label: "RUNWAY GEN-4" },
];

const ITEM_WIDTH = 380;
const GAP = 20;

const HorizontalGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const totalDistance = (galleryItems.length - 1) * (ITEM_WIDTH + GAP);
  const x = useTransform(scrollYProgress, [0, 1], [0, -totalDistance]);

  return (
    <div id="horizontal-gallery" ref={containerRef} className="overflow-hidden bg-background py-20 md:py-28">
      {/* Header */}
      <div className="mb-8 px-6 md:px-12">
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

      {/* Gallery track — moves on page scroll, no sticky/extra height */}
      <div className="overflow-hidden">
        <motion.div style={{ x }} className="flex gap-5 pl-6 md:pl-12">
          {galleryItems.map((item, i) => (
            <motion.div
              key={i}
              className="group relative flex-shrink-0 overflow-hidden rounded-2xl border border-border/40"
              style={{ width: ITEM_WIDTH, height: 420 }}
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
    </div>
  );
};

export default HorizontalGallery;
