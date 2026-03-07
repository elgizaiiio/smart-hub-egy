import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 25,
    yearlyPrice: 199,
    monthlyCredits: 250,
    yearlyCredits: 2500,
    featured: false,
    badge: null,
    tier: "starter" as const,
    features: [
      "250 credits / month",
      "All chat models",
      "Image generation",
      "File analysis",
      "Standard support",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 499,
    monthlyCredits: 500,
    yearlyCredits: 5000,
    featured: true,
    badge: "MOST POPULAR",
    tier: "pro" as const,
    features: [
      "500 credits / month",
      "All AI models access",
      "Image & Video generation",
      "Code sandbox + GitHub",
      "Priority support",
      "API access",
      "Social publishing",
    ],
  },
  {
    name: "Elite",
    monthlyPrice: 149,
    yearlyPrice: 1299,
    monthlyCredits: 1500,
    yearlyCredits: 15000,
    featured: false,
    badge: "PREMIUM 👑",
    tier: "elite" as const,
    features: [
      "1,500 credits / month",
      "All models (priority)",
      "Unlimited generations",
      "Full code IDE + deploy",
      "API access + webhooks",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

const tierStyles = {
  starter: {
    bg: "bg-[#1A1A2E]/80",
    border: "border-[#333355]",
    badge: "",
    badgeBg: "",
    btn: "bg-[#2A2A4A] text-foreground hover:bg-[#3A3A5A]",
    scale: "",
  },
  pro: {
    bg: "bg-[#7C3AED]/10",
    border: "border-[#7C3AED]",
    badge: "text-white",
    badgeBg: "bg-[#7C3AED]",
    btn: "bg-[#7C3AED] text-white hover:bg-[#6D28D9]",
    scale: "md:scale-105 md:z-10 shadow-xl shadow-[#7C3AED]/20",
  },
  elite: {
    bg: "bg-[#FFD700]/10",
    border: "border-[#FFD700]",
    badge: "text-[#1A1A2E]",
    badgeBg: "bg-gradient-to-r from-[#FFD700] to-[#FFA500]",
    btn: "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#1A1A2E] font-semibold hover:opacity-90",
    scale: "",
  },
};

const PricingPage = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 py-4 max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">Pricing</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Choose your plan</h2>
          <p className="text-muted-foreground text-sm mb-6">Scale your AI usage with flexible credit-based pricing</p>

          <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${!isYearly ? "bg-[#7C3AED] text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${isYearly ? "bg-[#7C3AED] text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold">Save</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => {
            const style = tierStyles[plan.tier];
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${style.bg} ${style.border} ${style.scale} transition-transform`}
              >
                {plan.badge && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full self-start tracking-wider ${style.badgeBg} ${style.badge}`}>
                    {plan.badge}
                  </span>
                )}
                <div>
                  <h3 className="font-display font-semibold text-foreground text-lg">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isYearly
                      ? `${plan.yearlyCredits.toLocaleString()} credits / year`
                      : `${plan.monthlyCredits.toLocaleString()} credits / month`}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-foreground">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                </div>
                <button className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${style.btn}`}>
                  Get Started
                </button>
                <ul className="space-y-2.5 mt-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${plan.tier === "elite" ? "text-[#FFD700]" : plan.tier === "pro" ? "text-[#7C3AED]" : "text-muted-foreground"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
