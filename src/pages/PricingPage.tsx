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
      "Chat models access",
      "Image generation (5/day)",
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
      "Image generation (50/day)",
      "Video generation (10/day)",
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
      "All AI models (priority queue)",
      "Unlimited image generation",
      "Video generation (100/day)",
      "Full code IDE + deploy",
      "API access",
      "Dedicated support",
    ],
  },
];

const creditCosts = [
  { action: "Chat message", cost: "1 credit" },
  { action: "Image generation", cost: "5 credits" },
  { action: "Video generation (short)", cost: "25 credits" },
  { action: "Video generation (long)", cost: "50 credits" },
  { action: "File analysis", cost: "3 credits" },
  { action: "Code execution", cost: "2 credits" },
];

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center px-4 md:px-6 h-14 border-b border-border">
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-lg text-foreground">Pricing</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">Choose your plan</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">Scale your AI usage with flexible credit-based pricing</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-panel p-6 flex flex-col gap-4 transition-all duration-300 ${
                plan.featured ? "border-foreground/30 shadow-lg shadow-foreground/5" : ""
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
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}>
                Get Started
              </button>

              <ul className="space-y-3 mt-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-foreground/60" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-6">Credit Usage</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {creditCosts.map((item) => (
              <div key={item.action} className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary">
                <span className="text-sm text-foreground">{item.action}</span>
                <span className="text-sm text-muted-foreground">{item.cost}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
