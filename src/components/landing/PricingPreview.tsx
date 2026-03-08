import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import FancyButton from "@/components/FancyButton";

const plans = [
  {
    name: "Starter",
    price: "25",
    period: "/mo",
    yearlyNote: "or $199/yr (save 34%)",
    description: "Great for getting started with AI creation",
    features: [
      "250 MC / month",
      "All chat models",
      "Code generation + live preview",
      "Deploy + publish (3 projects)",
      "GitHub sync",
      "File analysis",
      "Standard support",
    ],
    highlight: false,
    cardBorder: "border-white/[0.08]",
    cardBg: "bg-white/[0.02]",
    checkColor: "text-emerald-400",
    nameColor: "text-emerald-400",
  },
  {
    name: "Pro",
    price: "49",
    period: "/mo",
    yearlyNote: "or $499/yr (save 15%)",
    description: "For creators who need serious power & speed",
    features: [
      "500 MC / month",
      "All AI models access",
      "Code generation + live preview",
      "Deploy + publish (20 projects)",
      "GitHub sync + version control",
      "API access",
      "Social publishing (10 platforms)",
      "Priority support",
    ],
    highlight: true,
    cardBorder: "border-purple-500/30",
    cardBg: "bg-gradient-to-b from-purple-500/[0.12] to-purple-900/[0.06]",
    checkColor: "text-purple-400",
    nameColor: "text-purple-400",
  },
  {
    name: "Elite",
    price: "149",
    period: "/mo",
    yearlyNote: "or $1,299/yr (save 28%)",
    description: "Unlimited power for professionals & teams",
    features: [
      "1,500 MC / month",
      "All models (priority speed)",
      "Unlimited deploy + publish",
      "GitHub sync + version control",
      "API access + webhooks",
      "Unlimited social publishing",
      "Dedicated support",
    ],
    highlight: false,
    cardBorder: "border-amber-500/[0.15]",
    cardBg: "bg-gradient-to-b from-amber-500/[0.06] to-amber-900/[0.02]",
    checkColor: "text-amber-400",
    nameColor: "text-amber-400",
  },
];

const PricingPreview = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative overflow-hidden py-16 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-[10vw] font-black uppercase tracking-tighter leading-[0.85] text-white md:text-[8vw]">
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
              className={`relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] md:rounded-3xl md:p-9 ${plan.cardBorder} ${plan.cardBg} ${
                plan.highlight ? "shadow-xl shadow-purple-500/10" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}

              <h3 className={`text-lg font-bold ${plan.nameColor}`}>{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">
                  ${plan.price}
                </span>
                <span className="text-base text-white/40">{plan.period}</span>
              </div>
              <p className="mt-1.5 text-xs text-white/25">{plan.yearlyNote}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/40">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-base text-white/60">
                    <Check size={16} className={`shrink-0 ${plan.checkColor}`} />
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
                    onClick={() => navigate("/auth")}
                    className="w-full rounded-xl border border-white/15 py-3 text-base font-medium text-white/70 transition-all hover:border-white/30 hover:text-white"
                  >
                    Get Started
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
