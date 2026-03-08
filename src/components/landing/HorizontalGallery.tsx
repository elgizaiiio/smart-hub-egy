import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const galleryItems = [
  { src: "/showcase/model-1.jpg", label: "MEGSY V1", model: "megsy", desc: "Hyper-realistic portraits with cinematic depth" },
  { src: "/showcase/model-2.jpg", label: "FLUX KONTEXT MAX", model: "flux", desc: "Fashion & product photography with studio lighting" },
  { src: "/showcase/model-3.jpg", label: "RECRAFT V4", model: "recraft", desc: "Fantasy & cinematic concept art generation" },
  { src: "/showcase/model-4.jpg", label: "IDEOGRAM 3", model: "ideogram", desc: "Natural portrait photography with film grain" },
  { src: "/showcase/model-5.jpg", label: "HIDREAM I1", model: "hidream", desc: "Ornate detail & jeweled fantasy illustrations" },
  { src: "/showcase/model-6.jpg", label: "NANO BANANA 2", model: "nano", desc: "Classical painting style with atmospheric lighting" },
];

const CARD_W = 320;
const GAP = 24;
const TOTAL_TRACK = galleryItems.length * (CARD_W + GAP);

const HorizontalGallery = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -(TOTAL_TRACK - window.innerWidth + 100)]);

  return (
    <div ref={wrapperRef} style={{ height: `${TOTAL_TRACK}px` }}>
      <div className="sticky top-0 overflow-hidden bg-background py-16 md:py-20 h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="mx-auto max-w-7xl px-6 md:px-12 mb-10">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-foreground md:text-6xl">
            IMAGE <span className="text-primary">MODELS</span>
          </h2>
          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            Explore what each model can create — from hyper-real portraits to epic fantasy worlds.
          </p>
        </div>

        {/* Horizontal track pinned while scrolling */}
        <motion.div style={{ x }} className="flex gap-6 pl-6 md:pl-12 will-change-transform">
          {galleryItems.map((item, i) => (
            <div
              key={i}
              className="group relative flex-shrink-0 overflow-hidden rounded-2xl border border-border/30"
              style={{ width: CARD_W, height: 440 }}
            >
              <img
                src={item.src}
                alt={item.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-85" />

              {item.model === "megsy" && (
                <div className="absolute top-4 left-4 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                  Megsy Model
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
                  {item.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground/70 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HorizontalGallery;
