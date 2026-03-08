import { motion } from "framer-motion";

interface FeatureBlockProps {
  bigText: string;
  title: string;
  description: string;
  features: string[];
  media: string;
  mediaType?: "image" | "video";
  reverse?: boolean;
}

const FeatureBlock = ({
  bigText,
  title,
  description,
  features,
  media,
  mediaType = "image",
  reverse = false,
}: FeatureBlockProps) => {
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      {/* Giant background text */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? 300 : -300 }}
        whileInView={{ opacity: 0.04, x: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 select-none ${reverse ? "right-0" : "left-0"}`}
      >
        <span className="font-display text-[25vw] font-black uppercase leading-none tracking-tighter text-purple-500">
          {bigText}
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className={`flex flex-col items-center gap-14 lg:gap-24 ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
          {/* Media */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 140 : -140, scale: 0.92 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full flex-1"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/5">
              {mediaType === "video" ? (
                <video src={media} autoPlay loop muted playsInline className="h-auto w-full" />
              ) : (
                <img src={media} alt={title} className="h-auto w-full object-cover" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -100 : 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
            className="w-full flex-1"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">{title}</p>

            <h2 className="mb-7 font-display text-6xl font-black uppercase leading-[0.85] tracking-tight text-white md:text-8xl">
              {bigText}
            </h2>

            <p className="mb-10 text-base leading-relaxed text-white/45 md:text-lg">{description}</p>

            <div className="space-y-5">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.25 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/15 border border-purple-500/25 text-sm font-bold text-purple-300">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-relaxed text-white/60 md:text-base">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureBlock;
