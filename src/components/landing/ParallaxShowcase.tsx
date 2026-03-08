import { motion } from "framer-motion";

const parallaxItems: { src: string; type?: string; label: string }[] = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video", label: "CINEMATIC" },
];

const animations = [
  { initial: { opacity: 0, x: -80 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, x: 80 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, y: 80, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 } },
  { initial: { opacity: 0, x: -80 }, animate: { opacity: 1, x: 0 } },
  { initial: { opacity: 0, y: 60, rotateX: 10 }, animate: { opacity: 1, y: 0, rotateX: 0 } },
];

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

      <div className="flex flex-col gap-16 md:gap-24">
        {parallaxItems.map((item, i) => (
          <motion.div
            key={i}
            initial={animations[i].initial}
            whileInView={animations[i].animate}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
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
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ParallaxShowcase;
