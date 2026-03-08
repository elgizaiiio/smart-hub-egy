import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Mail } from "lucide-react";
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
      "250 MC / month",
      "All chat models",
      "Image generation",
      "Video generation",
      "Code generation + live preview",
      "Deploy + publish",
      "GitHub sync",
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
  },
  {
    name: "Elite",
    monthlyPrice: 149,
    yearlyPrice: 1299,
    monthlyCredits: 1500,
    yearlyCredits: 15000,
    featured: false,
    badge: "PREMIUM",
    tier: "elite" as const,
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
  },
];

const yearlyFeatureOverrides: Record<string, string[]> = {
  Starter: [
    "2,500 MC / year",
    "All chat models",
    "Image generation",
    "Video generation",
    "Code generation + live preview",
    "Deploy + publish",
    "GitHub sync",
    "File analysis",
    "Standard support",
  ],
  Pro: [
    "5,000 MC / year",
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
  Elite: [
    "15,000 MC / year",
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
};

const tierCardStyles = {
  starter: {
    card: "pricing-card-starter",
    badge: "",
    checkColor: "text-emerald-400",
  },
  pro: {
    card: "pricing-card-pro",
    badge: "bg-white/20 text-white backdrop-blur-sm",
    checkColor: "text-purple-300",
  },
  elite: {
    card: "pricing-card-elite",
    badge: "bg-white/20 text-white backdrop-blur-sm",
    checkColor: "text-amber-300",
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
          <p className="text-muted-foreground text-sm mb-6">One platform. Infinite possibilities.</p>

          <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${!isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">Save</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => {
            const style = tierCardStyles[plan.tier];
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const features = isYearly ? yearlyFeatureOverrides[plan.name] : plan.features;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${style.card} rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden ${plan.featured ? "md:scale-105 z-10" : ""}`}
              >
                {/* Animated particles */}
                <div className="pricing-points-wrapper">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <span key={j} className="pricing-point" />
                  ))}
                </div>

                {plan.badge && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full self-start uppercase tracking-wider ${style.badge}`}>
                    {plan.badge}
                  </span>
                )}
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-white">
                    ${price}
                  </span>
                  <span className="text-sm text-white/60">/{isYearly ? "year" : "month"}</span>
                </div>

                <button className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium text-sm transition-all border border-white/10">
                  Get Started
                </button>

                <ul className="space-y-2.5 mt-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${style.checkColor}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Enterprise Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 rounded-2xl border border-border bg-card p-8 text-center"
        >
          <h3 className="font-display text-xl font-bold text-foreground mb-2">Enterprise</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Custom plans for large teams with dedicated infrastructure, SLA guarantees, and priority support.
          </p>
          <a
            href="mailto:support@megsyai.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Sales
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
