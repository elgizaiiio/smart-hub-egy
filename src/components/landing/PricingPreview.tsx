import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import FancyButton from "@/components/FancyButton";

const plans = [
  {
    name: "Starter",
    price: "9",
    period: "/mo",
    yearlyNote: "or $89/yr (save 18%)",
    description: "Great for getting started with AI creation",
    features: [
      "100 MC / month",
      "All chat models",
      "Image generation",
      "Video generation",
      "Code generation + live preview",
      "Deploy + publish",
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
    price: "29",
    period: "/mo",
    yearlyNote: "or $249/yr (save 28%)",
    description: "For creators who need serious power & speed",
    features: [
      "500 MC / month",
      "All AI models access",
      "Image generation",
      "Video generation",
      "Code generation + live preview",
      "Deploy + publish",
      "GitHub sync + version control",
      "File analysis",
      "API access",
      "Social publishing",
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
    price: "49",
    period: "/mo",
    yearlyNote: "or $499/yr (save 15%)",
    description: "Unlimited power for professionals & teams",
    features: [
      "1,500 MC / month",
      "All models (priority speed)",
      "Unlimited image generation",
      "Unlimited video generation",
      "Code generation + live preview",
      "Unlimited deploy + publish",
      "GitHub sync + version control",
      "File analysis",
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
              <div className="mt-2 flex items-baseline gap-1 md:mt-3">
                <span className="text-4xl font-black text-white md:text-5xl">
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

        {/* Enterprise card */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 relative rounded-2xl border border-cyan-500/20 p-6 md:rounded-3xl md:p-9 bg-gradient-to-br from-cyan-950/30 via-transparent to-blue-950/20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.06),transparent_50%)] rounded-2xl md:rounded-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-lg font-bold text-cyan-400">Enterprise</h3>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-white md:text-5xl">$149</span>
                <span className="text-base text-white/40">/mo</span>
              </div>
              <p className="mt-1.5 text-xs text-white/25">or $1,299/yr — Custom plans available</p>
              <p className="mt-3 text-sm leading-relaxed text-white/40 max-w-lg">
                Dedicated infrastructure, SLA guarantees, white-label options, and a dedicated account manager for your team.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => navigate("/enterprise")}
                className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-8 py-3 text-base font-medium text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/30"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingPreview;
