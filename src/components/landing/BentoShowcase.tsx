import { motion } from "framer-motion";

const bentoItems = [
  { src: "/showcase/bento-1.jpg", label: "Cyberpunk Portrait", span: "col-span-6 row-span-4 md:col-span-4" },
  { src: "/showcase/bento-2.jpg", label: "Golden Dragon", span: "col-span-6 row-span-3 md:col-span-3" },
  { src: "/showcase/bento-4.jpg", label: "Neon City", span: "col-span-12 row-span-4 md:col-span-5 md:row-span-5" },
  { src: "/showcase/bento-3.jpg", label: "Ethereal Forest", span: "col-span-6 row-span-3 md:col-span-3" },
  { src: "/showcase/bento-5.jpg", label: "Samurai Sunset", span: "col-span-6 row-span-4 md:col-span-4" },
  { src: "/showcase/bento-6.jpg", label: "Steampunk Robot", span: "col-span-12 row-span-3 md:col-span-5 md:row-span-3" },
];

const BentoShowcase = () => {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-28">
      {/* ambient glassy blobs (semantic tokens only) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 left-10 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.65 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
            Gallery
            <span className="h-1 w-1 rounded-full bg-muted-foreground/70" />
            Fresh generations
          </div>

          <h2 className="mt-5 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">
            AI <span className="text-primary">Masterpieces</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Bento-style showcase with new, never-used visuals — built to feel premium, not stock.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-border/60 bg-card/25 p-3 backdrop-blur-md md:p-4">
          <div className="grid auto-rows-[92px] grid-cols-12 gap-3 md:auto-rows-[112px] md:gap-4">
            {bentoItems.map((item, i) => (
              <motion.figure
                key={item.src}
                initial={{ opacity: 0, y: 14, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl border border-border/55 bg-card/15 ${item.span} transition-transform duration-300 hover:-translate-y-0.5`}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                />

                {/* glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/15 to-transparent" />

                {/* top highlight stroke */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border/60 opacity-60" />

                <figcaption className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-background/35 px-3 py-1 text-xs font-bold tracking-wide text-foreground backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoShowcase;
