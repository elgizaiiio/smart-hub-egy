import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "مناسب للبدء وتجربة كل مسارات المنصة",
    features: [
      "50 Credits مجانية عند التسجيل",
      "الوصول لكل فئات النماذج",
      "سرعة توليد قياسية",
      "تصدير حتى 720p",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "19",
    period: "/month",
    description: "للصناع الذين يحتاجون سرعة أعلى وجودة إنتاج أكبر",
    features: [
      "2000 Credits شهرياً",
      "أولوية في المعالجة",
      "صور 4K + فيديو HD",
      "API Access",
      "دعم أولوية",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "للشركات والفرق متعددة المنتجات",
    features: [
      "خطط استخدام مرنة",
      "إدارة فرق وصلاحيات",
      "تكاملات مخصصة",
      "SLA ودعم مخصص",
    ],
    highlight: false,
  },
];

const PricingPreview = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center"
        >
          <h2 className="font-display text-5xl font-black uppercase tracking-tight text-foreground md:text-7xl">
            SIMPLE PRICING
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            خطط واضحة حسب حجم شغلك، بدون تعقيد أو رسوم مخفية.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              className={`relative rounded-3xl border p-8 ${
                plan.highlight
                  ? "border-primary/50 bg-primary/10 shadow-xl shadow-primary/20"
                  : "border-border bg-card/70"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-background px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Most Popular
                </div>
              )}

              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">{plan.name}</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-black text-foreground">{plan.price === "Custom" ? plan.price : `$${plan.price}`}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/85">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-bold text-foreground">
                      {featureIndex + 1}
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.highlight ? (
                  <FancyButton onClick={() => navigate("/auth")} className="w-full">
                    Get Started
                  </FancyButton>
                ) : (
                  <button
                    onClick={() => (plan.name === "Enterprise" ? undefined : navigate("/auth"))}
                    className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
