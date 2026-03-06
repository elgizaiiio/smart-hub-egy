import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const plans = [
  {
    name: "Starter",
    price: 25,
    credits: 500,
    icon: <Zap className="w-5 h-5" />,
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
    icon: <Crown className="w-5 h-5" />,
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
    icon: <Rocket className="w-5 h-5" />,
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
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border">
        <button onClick={() => navigate("/chat")} className="flex items-center gap-3">
          <img src={logo} alt="egy" className="w-7 h-7" />
          <span className="font-display font-bold text-lg text-foreground">egy</span>
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 silver-gradient">
            Choose your plan
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Scale your AI usage with flexible credit-based pricing
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`pricing-card ${plan.featured ? "featured" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.featured ? "bg-silver/20 text-silver-bright" : "bg-secondary text-muted-foreground"
                }`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.credits.toLocaleString()} credits</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-foreground">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>

              <button className={plan.featured ? "silver-button w-full" : "glass-button w-full"}>
                Get Started
              </button>

              <ul className="space-y-3 mt-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Credit Costs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 md:p-8"
        >
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Credit Usage
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {creditCosts.map((item) => (
              <div
                key={item.action}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary"
              >
                <span className="text-sm text-foreground">{item.action}</span>
                <span className="text-sm font-medium text-silver">{item.cost}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
