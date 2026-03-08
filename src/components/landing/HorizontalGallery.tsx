import { motion } from "framer-motion";
import { useRef, useState } from "react";

const galleryItems = [
  { src: "/showcase/model-1.jpg", label: "MEGSY V1", model: "megsy", desc: "Hyper-realistic portraits with cinematic depth" },
  { src: "/showcase/model-2.jpg", label: "FLUX KONTEXT MAX", model: "flux", desc: "Fashion & product photography with studio lighting" },
  { src: "/showcase/model-3.jpg", label: "RECRAFT V4", model: "recraft", desc: "Fantasy & cinematic concept art generation" },
  { src: "/showcase/model-4.jpg", label: "IDEOGRAM 3", model: "ideogram", desc: "Natural portrait photography with film grain" },
  { src: "/showcase/model-5.jpg", label: "HIDREAM I1", model: "hidream", desc: "Ornate detail & jeweled fantasy illustrations" },
  { src: "/showcase/model-6.jpg", label: "NANO BANANA 2", model: "nano", desc: "Classical painting style with atmospheric lighting" },
];

const HorizontalGallery = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = 340 + 24;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, galleryItems.length - 1));
  };

  return (
    <section className="bg-background py-20 md:py-28">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-foreground md:text-6xl">
            IMAGE <span className="text-primary">MODELS</span>
          </h2>
          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            Explore what each model can create — from hyper-real portraits to epic fantasy worlds.
          </p>
        </motion.div>
      </div>

      {/* Scrollable gallery */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-10 flex gap-6 overflow-x-auto px-6 pb-6 md:px-12 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {galleryItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative flex-shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-border/30"
            style={{ width: 340, height: 460 }}
          >
            <img
              src={item.src}
              alt={item.label}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

            {/* Model badge */}
            {item.model === "megsy" && (
              <div className="absolute top-4 left-4 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                Megsy Model
              </div>
            )}

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                0{i + 1}
              </span>
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">
                {item.label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground/80 opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scroll indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {galleryItems.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              scrollRef.current?.scrollTo({ left: i * (340 + 24), behavior: "smooth" });
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-8 bg-primary"
                : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HorizontalGallery;
