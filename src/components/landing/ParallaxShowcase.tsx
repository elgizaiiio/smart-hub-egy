import { motion } from "framer-motion";

const parallaxItems: { src: string; type?: string; label: string }[] = [
  { src: "/api-showcase/showcase-1.png", label: "CONCEPT ART" },
  { src: "/api-showcase/video-5.mp4", type: "video", label: "MOTION DESIGN" },
  { src: "/api-showcase/showcase-3.jpg", label: "PRODUCT SHOT" },
  { src: "/api-showcase/showcase-4.jpg", label: "EDITORIAL" },
  { src: "/api-showcase/video-6.mp4", type: "video", label: "CINEMATIC" },
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

      {/* Stacked cards */}
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="relative">
          {parallaxItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.7, y: 200, rotateX: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 mb-[-6rem] last:mb-0 md:mb-[-8rem]"
              style={{ 
                zIndex: parallaxItems.length + i,
                perspective: "1000px",
              }}
            >
              <div className="group overflow-hidden rounded-2xl border border-border/40 bg-card/30 shadow-2xl shadow-background/50 backdrop-blur-sm md:rounded-[2rem]">
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
      </div>
    </section>
  );
};

export default ParallaxShowcase;
