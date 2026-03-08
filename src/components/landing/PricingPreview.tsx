import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import FancyButton from "@/components/FancyButton";

const plans = [
  {
    name: "Starter",
    price: "25",
    period: "/month",
    yearlyPrice: "$2,500/yr",
    description: "Everything you need to get started with AI creation",
    features: [
      "250 MC credits/month",
      "All chat models",
      "50 image generations",
      "5 video generations",
      "Standard speed",
      "Community support",
    ],
    highlight: false,
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/[0.06]",
    badgeColor: "",
    checkColor: "text-emerald-400",
  },
  {
    name: "Pro",
    price: "49",
    period: "/month",
    yearlyPrice: "$5,000/yr",
    description: "For serious creators who demand more power",
    features: [
      "500 MC credits/month",
      "All AI models",
      "500 image generations",
      "50 video generations",
      "Priority speed",
      "Priority support",
    ],
    highlight: true,
    borderColor: "border-purple-500/40",
    bgColor: "bg-purple-500/[0.08]",
    badgeColor: "bg-purple-500",
    checkColor: "text-purple-400",
  },
  {
    name: "Elite",
    price: "149",
    period: "/month",
    yearlyPrice: "$15,000/yr",
    description: "Unlimited creative power for professionals",
    features: [
      "1,500 MC credits/month",
      "All AI models",
      "Unlimited images",
      "Unlimited videos",
      "Fastest speed",
      "Dedicated support",
    ],
    highlight: false,
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/[0.06]",
    badgeColor: "",
    checkColor: "text-amber-400",
  },
];

const PricingPreview = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-[12vw] font-black uppercase tracking-tighter leading-[0.85] text-white md:text-[8vw]">
            SIMPLE{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">PRICING</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xl text-white/40">
            Start free, scale as you grow. No hidden fees.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className={`relative rounded-3xl border p-9 ${
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

              <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">
                  {plan.price === "Custom" ? "" : "$"}{plan.price}
                </span>
                <span className="text-base text-white/40">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-white/40">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-base text-white/60">
                    <Check size={16} className="shrink-0 text-purple-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                {plan.highlight ? (
                  <FancyButton onClick={() => navigate("/auth")} className="w-full py-3 text-base">
                    Get Started
                  </FancyButton>
                ) : (
                  <button
                    onClick={() => plan.name === "Enterprise" ? undefined : navigate("/auth")}
                    className="w-full rounded-xl border border-white/15 py-3 text-base font-medium text-white/70 transition-all hover:border-white/30 hover:text-white"
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
