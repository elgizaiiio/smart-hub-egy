import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: 25,
    credits: 500,
    featured: false,
    features: [
      "500 credits / month",
      "Chat models (Free)",
      "Image generation (5 credits each)",
      "File analysis (3 credits each)",
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
      "Image generation (5 credits)",
      "Video generation (25 credits)",
      "Code sandbox with GitHub",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: 149,
    credits: 10000,
    featured: false,
    features: [
      "10,000 credits / month",
      "All AI models (priority)",
      "Unlimited image generation",
      "Video generation (25 credits)",
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
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors">
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
              className={`glass-panel p-6 flex flex-col gap-4 ${
                plan.featured ? "border-primary/30 shadow-lg shadow-primary/5" : ""
              }`}
            >
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
              <ul className="space-y-3 mt-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm text-muted-foreground">
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
