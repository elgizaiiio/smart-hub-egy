import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import FancyButton from "@/components/FancyButton";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Perfect for exploring Megsy's capabilities",
    features: [
      "50 free credits on signup",
      "Access to all 80+ models",
      "Standard generation speed",
      "Community support",
      "720p image exports",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "19",
    period: "/month",
    description: "For creators who need more power and speed",
    features: [
      "2,000 credits/month",
      "Priority generation queue",
      "4K image exports",
      "HD video generation",
      "API access",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and businesses at scale",
    features: [
      "Unlimited credits",
      "Dedicated GPU instances",
      "Custom model fine-tuning",
      "SSO & team management",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    highlight: false,
  },
];

const PricingPreview = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-6xl font-black uppercase tracking-tighter text-white md:text-8xl">
            SIMPLE{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">PRICING</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/40">
            Start free, scale as you grow. No hidden fees.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`relative rounded-3xl border p-8 ${
                plan.highlight
                  ? "border-purple-500/40 bg-purple-500/[0.08] shadow-xl shadow-purple-500/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {plan.price === "Custom" ? "" : "$"}{plan.price}
                </span>
                <span className="text-sm text-white/40">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-white/40">{plan.description}</p>

              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <Check size={14} className="shrink-0 text-purple-400" />
                    {f}
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
                    onClick={() => plan.name === "Enterprise" ? undefined : navigate("/auth")}
                    className="w-full rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-white/30 hover:text-white"
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
