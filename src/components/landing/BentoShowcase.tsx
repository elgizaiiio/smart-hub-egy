import { motion } from "framer-motion";

const bentoItems = [
  { src: "/showcase/bento-1.jpg", label: "Cyberpunk Portrait", span: "col-span-1 row-span-1" },
  { src: "/showcase/bento-2.jpg", label: "Golden Dragon", span: "col-span-1 row-span-1" },
  { src: "/showcase/bento-4.jpg", label: "Neon City", span: "col-span-2 row-span-1 md:col-span-2" },
  { src: "/showcase/bento-3.jpg", label: "Ethereal Forest", span: "col-span-1 row-span-1" },
  { src: "/showcase/bento-5.jpg", label: "Samurai Sunset", span: "col-span-1 row-span-1" },
  { src: "/showcase/bento-6.jpg", label: "Steampunk Robot", span: "col-span-2 row-span-1 md:col-span-2" },
];

const BentoShowcase = () => {
  return (
    <section className="bg-background py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center"
        >
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
            AI <span className="text-primary">MASTERPIECES</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Explore the infinite possibilities of AI-generated art — from cyberpunk to fantasy.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {bentoItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl border border-border/40 ${item.span}`}
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
                  <span className="text-sm font-bold text-foreground md:text-base">{item.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoShowcase;
