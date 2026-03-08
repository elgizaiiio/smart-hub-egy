import ModelBrandIcon from "@/components/landing/ModelBrandIcon";
import { LANDING_MODEL_BRANDS } from "@/components/landing/modelBrands";

const StatsMarquee = () => {
  const items = [...LANDING_MODEL_BRANDS, ...LANDING_MODEL_BRANDS, ...LANDING_MODEL_BRANDS];

  return (
    <section className="relative overflow-hidden border-y border-border bg-secondary/40 py-5">
      <div className="landing-marquee">
        <div className="landing-marquee-track">
          {items.map((model, index) => (
            <span
              key={`${model.id}-${index}`}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-foreground"
            >
              <ModelBrandIcon modelId={model.id} className="h-4 w-4" />
              {model.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsMarquee;
