import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/SEOHead";
import { Cookie, Shield, Settings, BarChart3 } from "lucide-react";

const cookieTypes = [
  {
    icon: Shield,
    name: "Essential Cookies",
    required: true,
    description: "Required for the platform to function. These handle authentication, session management, security tokens, and cookie consent preferences. Cannot be disabled.",
    examples: ["Session ID", "Auth token", "CSRF protection", "Cookie consent state"],
  },
  {
    icon: BarChart3,
    name: "Analytics Cookies",
    required: false,
    description: "Help us understand how visitors interact with Megsy. We use this data to improve features, fix issues, and optimize the user experience. No personal identification.",
    examples: ["Page views", "Feature usage", "Error tracking", "Performance metrics"],
  },
  {
    icon: Settings,
    name: "Preference Cookies",
    required: false,
    description: "Remember your settings and choices — like theme preference, language, and display options — so you don't have to reconfigure them each visit.",
    examples: ["Theme (dark/light)", "Language preference", "UI layout", "Notification settings"],
  },
];

const CookiePolicyPage = () => (
  <div data-theme="dark" className="min-h-screen bg-background text-foreground">
    <SEOHead
      title="Cookie Policy"
      description="Understand how Megsy AI uses cookies. Learn about cookie types, your choices, and how to manage cookie preferences."
      path="/cookies"
    />
    <LandingNavbar />

    <section className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 text-center">
        <h1 className="font-display text-5xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl">
          Cookie <span className="text-primary">Policy</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Last updated: March 14, 2026</p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>

    <section className="mx-auto max-w-4xl px-6 pb-28">
      {/* Intro */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 rounded-2xl border border-white/[0.06] bg-card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-primary/10 p-2.5"><Cookie className="h-5 w-5 text-primary" /></div>
          <h2 className="text-xl font-bold text-foreground">What Are Cookies?</h2>
        </div>
        <p className="text-sm leading-[1.8] text-muted-foreground">
          Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience. Megsy uses cookies responsibly and transparently. We do not use third-party advertising or tracking cookies.
        </p>
      </motion.div>

      {/* Cookie Types */}
      <div className="space-y-6">
        {cookieTypes.map((type, i) => (
          <motion.div
            key={type.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-white/[0.06] bg-card p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5"><type.icon className="h-5 w-5 text-primary" /></div>
                <h2 className="text-xl font-bold text-foreground">{type.name}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${type.required ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-muted-foreground"}`}>
                {type.required ? "Required" : "Optional"}
              </span>
            </div>
            <p className="text-sm leading-[1.8] text-muted-foreground mb-4">{type.description}</p>
            <div className="flex flex-wrap gap-2">
              {type.examples.map((ex) => (
                <span key={ex} className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground border border-white/[0.06]">
                  {ex}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Managing */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 rounded-2xl border border-white/[0.06] bg-card p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Managing Your Cookies</h2>
        <p className="text-sm leading-[1.8] text-muted-foreground">
          You can manage cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. Note that disabling essential cookies may prevent the platform from functioning properly. For analytics and preference cookies, you can opt out through the cookie consent banner that appears on your first visit, or by clearing your browser data.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 rounded-2xl border border-white/[0.06] bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Questions about cookies? Contact us at{" "}
          <a href="mailto:privacy@megsyai.com" className="text-primary hover:underline">privacy@megsyai.com</a>
        </p>
      </motion.div>
    </section>

    <LandingFooter />
  </div>
);

export default CookiePolicyPage;
