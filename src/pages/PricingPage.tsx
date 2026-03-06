import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: 25,
    credits: 500,
    featured: false,
    features: [
      "500 credits / month",
      "All chat models (Free)",
      "Image generation",
      "File analysis",
      "Standard support",
    ],
  },
  {
    name: "Pro",
    price: 59,
    credits: 2000,
    featured: true,
    features: [
      "2,000 credits / month",
      "All AI models access",
      "Image & Video generation",
      "Code sandbox with GitHub",
      "Priority support",
      "API access",
    ],
  },
  {
    name: "Business",
    price: 149,
    credits: 10000,
    featured: false,
    features: [
      "10,000 credits / month",
      "All models (priority)",
      "Unlimited generations",
      "Full code IDE + deploy",
      "API access",
      "Dedicated support",
    ],
  },
];

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 py-4 max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">Pricing</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Choose your plan</h2>
          <p className="text-muted-foreground text-sm">Scale your AI usage with flexible credit-based pricing</p>
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
              {plan.featured && (
                <span className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full self-start">Most Popular</span>
              )}
              <div>
                <h3 className="font-display font-semibold text-foreground text-lg">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.credits.toLocaleString()} credits</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-foreground">${plan.price}</span>
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
