import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 9.97,
    yearlyPrice: 6.97,
    credits: 100,
    featured: false,
    badge: null,
    features: [
      "100 credits / month",
      "All chat models",
      "Image generation",
      "File analysis",
      "Standard support",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 29.97,
    yearlyPrice: 19.97,
    credits: 500,
    featured: true,
    badge: "Most Popular",
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
    name: "Business",
    monthlyPrice: 79.97,
    yearlyPrice: 54.97,
    credits: 2000,
    featured: false,
    badge: "Best Value",
    features: [
      "2,000 credits / month",
      "All models (priority)",
      "Unlimited generations",
      "Full code IDE + deploy",
      "API access + webhooks",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Choose your plan</h2>
          <p className="text-muted-foreground text-sm mb-6">Scale your AI usage with flexible credit-based pricing</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-secondary rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Yearly
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "hsl(142 50% 45% / 0.2)", color: "hsl(142 50% 45%)" }}>-33%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                plan.featured ? "border-primary shadow-lg shadow-primary/10" : "border-border"
              }`}
            >
              {plan.badge && (
                <span className={`text-xs font-medium px-3 py-1 rounded-full self-start ${
                  plan.featured ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  {plan.badge}
                </span>
              )}
              <div>
                <h3 className="font-display font-semibold text-foreground text-lg">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.credits.toLocaleString()} credits / month</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-foreground">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <button className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                plan.featured
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}>
                Get Started
              </button>
              <ul className="space-y-2.5 mt-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
