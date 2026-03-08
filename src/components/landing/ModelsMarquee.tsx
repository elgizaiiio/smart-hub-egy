import { motion } from "framer-motion";
import ModelBrandIcon from "@/components/landing/ModelBrandIcon";
import { LANDING_MODEL_BRANDS } from "@/components/landing/modelBrands";

const ModelsMarquee = () => {
  const items = [...LANDING_MODEL_BRANDS, ...LANDING_MODEL_BRANDS];

  return (
    <section id="models" className="relative overflow-hidden py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-10 px-6 text-center"
      >
        <h2 className="font-display text-5xl font-black uppercase tracking-tight text-foreground md:text-7xl">
          80+ AI MODELS
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          كل النماذج الأساسية في سوق الذكاء الاصطناعي موجودة داخل Megsy في واجهة واحدة مع هوية واضحة لكل نموذج.
        </p>
      </motion.div>

      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            {items.map((model, index) => (
              <span
                key={`${model.id}-top-${index}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card/80 px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                <ModelBrandIcon modelId={model.id} className="h-4 w-4" />
                {model.name}
                {model.flagship && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Flagship
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track-reverse">
            {[...items].reverse().map((model, index) => (
              <span
                key={`${model.id}-bottom-${index}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-secondary/70 px-5 py-2.5 text-sm font-semibold text-foreground/85"
              >
                <ModelBrandIcon modelId={model.id} className="h-4 w-4" />
                {model.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelsMarquee;
