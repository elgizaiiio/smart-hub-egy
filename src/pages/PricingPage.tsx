import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Mail, Building2, Calendar, Zap, Cpu, Infinity, Server, ShieldCheck, Users, Gauge, Clock, HeadphonesIcon, Webhook, Globe, BarChart3, HardDrive, Headset } from "lucide-react";
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

          <div className="relative inline-flex items-center gap-0 rounded-full p-1 bg-muted/50 backdrop-blur-xl border border-border/50 shadow-lg">
            <motion.div
              layoutId="pricing-toggle-indicator"
              className="absolute top-1 bottom-1 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
              style={{ width: isYearly ? "calc(55% - 4px)" : "calc(45% - 4px)" }}
              animate={{ left: isYearly ? "calc(45% + 2px)" : "4px" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button
              onClick={() => setIsYearly(false)}
              className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${!isYearly ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative z-10 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${isYearly ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className="notranslate">Yearly</span>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="notranslate inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 leading-none whitespace-nowrap ring-1 ring-emerald-500/30"
              >
                Save 20%
              </motion.span>
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
                className={`${style.card} rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden ${plan.featured ? "md:scale-105 md:z-10" : ""}`}
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="enterprise-card mt-14 relative rounded-2xl overflow-hidden"
        >
          {/* Animated gradient border */}
          <div className="enterprise-border-glow" />

          {/* Inner content */}
          <div className="relative z-10 rounded-[14px] bg-gradient-to-br from-[hsl(245,40%,12%)] via-[hsl(260,35%,10%)] to-[hsl(220,40%,8%)] p-8 md:p-10">
            {/* Particles */}
            <div className="pricing-points-wrapper">
              {Array.from({ length: 14 }).map((_, j) => (
                <span key={j} className="pricing-point" />
              ))}
            </div>

            {/* Badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-white/10 text-white/70 uppercase tracking-widest mb-6 border border-white/10"
            >
              <Building2 className="w-3 h-3" />
              For Teams & Organizations
            </motion.span>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              {/* Left — Title & Description */}
              <div className="md:max-w-sm">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">Enterprise</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Tailored solutions for large teams and organizations. Get dedicated infrastructure, custom integrations, and enterprise-grade security with guaranteed uptime.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <a
                    href="mailto:support@megsyai.com"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Sales
                  </a>
                  <a
                    href="mailto:support@megsyai.com?subject=Book%20a%20Demo"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:border-white/30 hover:text-white transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    Book a Demo
                  </a>
                </div>
              </div>

              {/* Right — Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {[
                  { icon: Zap, label: "Custom MC allocation" },
                  { icon: Cpu, label: "All AI models (priority queue)" },
                  { icon: Infinity, label: "Unlimited images, videos & deploys" },
                  { icon: Server, label: "Dedicated infrastructure" },
                  { icon: ShieldCheck, label: "SSO & SAML authentication" },
                  { icon: Users, label: "Team management & roles" },
                  { icon: Gauge, label: "Custom API rate limits" },
                  { icon: Clock, label: "99.9% uptime SLA guarantee" },
                  { icon: HeadphonesIcon, label: "Dedicated account manager" },
                  { icon: Webhook, label: "Custom integrations & webhooks" },
                  { icon: Globe, label: "Data residency options" },
                  { icon: BarChart3, label: "Advanced analytics & reporting" },
                  { icon: HardDrive, label: "On-premise deployment option" },
                  { icon: Headset, label: "Priority 24/7 support" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 py-1.5 text-sm text-white/70">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-purple-400/80" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
