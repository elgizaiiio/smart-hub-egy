import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
{
  name: "Starter",
  monthlyPrice: 9,
  yearlyPrice: 89,
  monthlyCredits: 100,
  yearlyCredits: 1200,
  featured: false,
  badge: null,
  tier: "starter" as const,
  features: [
  "100 MC / month",
  "All chat models",
  "Image generation",
  "Video generation",
  "Code generation + live preview",
  "Deploy + publish",
  "GitHub sync",
  "File analysis",
  "Standard support"]

},
{
  name: "Pro",
  monthlyPrice: 29,
  yearlyPrice: 249,
  monthlyCredits: 500,
  yearlyCredits: 6000,
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
  "Priority support"]

},
{
  name: "Elite",
  monthlyPrice: 49,
  yearlyPrice: 499,
  monthlyCredits: 1500,
  yearlyCredits: 18000,
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
  "Dedicated support"]

}];


const yearlyFeatureOverrides: Record<string, string[]> = {
  Starter: [
  "1,200 MC / year",
  "All chat models",
  "Image generation",
  "Video generation",
  "Code generation + live preview",
  "Deploy + publish",
  "GitHub sync",
  "File analysis",
  "Standard support"],

  Pro: [
  "6,000 MC / year",
  "All AI models access",
  "Image generation",
  "Video generation",
  "Code generation + live preview",
  "Deploy + publish",
  "GitHub sync + version control",
  "File analysis",
  "API access",
  "Social publishing",
  "Priority support"],

  Elite: [
  "18,000 MC / year",
  "All models (priority speed)",
  "Unlimited image generation",
  "Unlimited video generation",
  "Code generation + live preview",
  "Unlimited deploy + publish",
  "GitHub sync + version control",
  "File analysis",
  "API access + webhooks",
  "Unlimited social publishing",
  "Dedicated support"]

};

const tierCardStyles = {
  starter: {
    card: "pricing-card-starter",
    badge: "",
    checkColor: "text-emerald-400"
  },
  pro: {
    card: "pricing-card-pro",
    badge: "bg-white/20 text-white backdrop-blur-sm",
    checkColor: "text-purple-300"
  },
  elite: {
    card: "pricing-card-elite",
    badge: "bg-white/20 text-white backdrop-blur-sm",
    checkColor: "text-amber-300"
  }
};

const PricingPage = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const enterprisePrice = isYearly ? 1299 : 149;
  const enterpriseFeatures = isYearly ?
  [
  "Custom MC allocation",
  "All models with priority speed",
  "Unlimited generation",
  "Dedicated infrastructure",
  "SLA guarantees",
  "Custom integrations",
  "White-label options",
  "Dedicated account manager",
  "Data privacy & compliance",
  "Volume discounts"] :

  [
  "Custom MC allocation",
  "All models with priority speed",
  "Unlimited generation",
  "Dedicated infrastructure",
  "SLA guarantees",
  "Custom integrations",
  "White-label options",
  "Dedicated account manager",
  "Data privacy & compliance",
  "Volume discounts"];


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
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${!isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-colors ${isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              
              <span className="notranslate">Yearly</span>
              <span className="notranslate inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 leading-none whitespace-nowrap">Save</span>
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
                className={`${style.card} rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden ${plan.featured ? "md:scale-105 z-10" : ""}`}>
                
                <div className="pricing-points-wrapper">
                  {Array.from({ length: 10 }).map((_, j) =>
                  <span key={j} className="pricing-point" />
                  )}
                </div>

                {plan.badge &&
                <span className={`text-xs font-bold px-3 py-1 rounded-full self-start uppercase tracking-wider ${style.badge}`}>
                    {plan.badge}
                  </span>
                }
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-white">
                    ${price}
                  </span>
                  <span className="text-sm text-white/60">/{isYearly ? "year" : "month"}</span>
                </div>

                <button className="w-full py-3 rounded-xl backdrop-blur-sm text-white font-medium text-sm transition-all border border-white/10 bg-destructive">
                  Get Started
                </button>

                <ul className="space-y-2.5 mt-2">
                  {features.map((feature) =>
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${style.checkColor}`} />
                      {feature}
                    </li>
                  )}
                </ul>
              </motion.div>);

          })}
        </div>

        {/* Enterprise Card — distinctive gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6">
          
          <div className="relative rounded-2xl p-6 flex flex-col gap-4 overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-background to-blue-950/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.08),transparent_50%)]" />
            <div className="pricing-points-wrapper">
              {Array.from({ length: 10 }).map((_, j) =>
              <span key={j} className="pricing-point" />
              )}
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full self-start uppercase tracking-wider bg-cyan-500/20 text-cyan-300 backdrop-blur-sm border border-cyan-500/20">
                <Sparkles className="w-3 h-3 inline mr-1" />
                ENTERPRISE
              </span>
              <div>
                <h3 className="font-display font-semibold text-white text-lg">Enterprise</h3>
                <p className="text-sm text-white/50 mt-1">Custom plans for large teams & businesses</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-white">
                  ${enterprisePrice}
                </span>
                <span className="text-sm text-white/60">/{isYearly ? "year" : "month"}</span>
              </div>
              <button
                onClick={() => navigate("/enterprise")}
                className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-sm text-cyan-200 font-medium text-sm transition-all border border-cyan-500/20">
                
                Contact Sales
              </button>
              <ul className="space-y-2.5 mt-2">
                {enterpriseFeatures.map((feature) =>
                <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                    {feature}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>);

};

export default PricingPage;