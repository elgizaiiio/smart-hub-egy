import { motion } from "framer-motion";

const parallaxItems = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video" as const, label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video" as const, label: "CINEMATIC" },
];

function ParallaxItem({ item, index }: { item: { src: string; type?: string; label: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="mx-auto w-full max-w-5xl px-6"
    >
      <div className="group relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/20">
        {item.type === "video" ? (
          <video
            src={item.src}
            autoPlay
            loop
            muted
            playsInline
            className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src={item.src}
            alt={item.label}
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute left-6 top-6">
          <span className="rounded-full bg-background/60 px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-foreground backdrop-blur-xl">
            {item.label}
          </span>
        </div>
        <div className="absolute bottom-4 right-6">
          <span className="font-display text-7xl font-black text-foreground/[0.05]">0{index + 1}</span>
        </div>
      </div>
    </motion.div>
  );
}

const ParallaxShowcase = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto mb-16 max-w-7xl px-6 text-center">
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

      <div className="flex flex-col gap-20 md:gap-32">
        {parallaxItems.map((item, i) => (
          <ParallaxItem key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
};

export default ParallaxShowcase;
