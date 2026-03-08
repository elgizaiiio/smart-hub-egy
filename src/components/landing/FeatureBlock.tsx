import { motion } from "framer-motion";
import ModelBrandIcon from "@/components/landing/ModelBrandIcon";

interface FeatureModel {
  id: string;
  name: string;
}

interface FeatureBlockProps {
  bigText: string;
  bigTextTone?: string;
  title: string;
  description: string;
  features: string[];
  media: string;
  mediaType?: "image" | "video";
  reverse?: boolean;
  models?: FeatureModel[];
}

const FeatureBlock = ({
  bigText,
  bigTextTone = "text-primary/20",
  title,
  description,
  features,
  media,
  mediaType = "image",
  reverse = false,
  models = [],
}: FeatureBlockProps) => {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <motion.div
        initial={{ opacity: 0, x: reverse ? 180 : -180 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 select-none ${reverse ? "right-0" : "left-0"}`}
      >
        <span className={`font-display text-[22vw] font-black uppercase tracking-tighter leading-none ${bigTextTone}`}>
          {bigText}
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className={`flex flex-col items-center gap-12 lg:gap-20 ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
          <motion.div
            initial={{ opacity: 0, x: reverse ? 110 : -110, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="w-full flex-1"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-2xl shadow-primary/10">
              {mediaType === "video" ? (
                <video src={media} autoPlay loop muted playsInline className="h-auto w-full" />
              ) : (
                <img src={media} alt={title} className="h-auto w-full object-cover" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reverse ? -80 : 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.12, ease: "easeOut" }}
            className="w-full flex-1"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70">{title}</p>
            <h2 className="mb-6 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground md:text-7xl">
              {bigText}
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.2 + index * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/80 md:text-base">{feature}</span>
                </motion.div>
              ))}
            </div>

            {models.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {models.map((model) => (
                  <span
                    key={model.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    <ModelBrandIcon modelId={model.id} className="h-3.5 w-3.5" />
                    {model.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureBlock;
