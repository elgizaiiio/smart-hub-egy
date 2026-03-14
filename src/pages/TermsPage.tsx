import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/SEOHead";
import { FileText, Shield, AlertTriangle, Scale, Globe, CreditCard, Ban, RefreshCw } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: `By accessing or using the Megsy platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service. Megsy reserves the right to update these Terms at any time. Continued use after changes constitutes acceptance of the modified Terms. We will notify registered users of material changes via email or in-app notification.`,
  },
  {
    icon: Shield,
    title: "2. Account Registration",
    content: `You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You agree to provide accurate, current, and complete information during registration. Megsy reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.`,
  },
  {
    icon: Scale,
    title: "3. Acceptable Use",
    content: `You agree not to use Megsy to: (a) generate illegal, harmful, or deceptive content; (b) infringe on intellectual property rights; (c) harass, abuse, or harm others; (d) distribute malware or spam; (e) attempt to reverse-engineer, decompile, or extract model weights; (f) use automated systems to scrape or overload the Service; (g) generate content depicting minors in inappropriate contexts. Violations may result in immediate account termination without refund.`,
  },
  {
    icon: CreditCard,
    title: "4. Credits & Payments",
    content: `Megsy operates on a credit-based system ("Megsy Credits" or "MC"). Credits are purchased in advance and deducted per usage. Credit costs vary by model and feature. Credits are non-refundable except where required by applicable law. Free credits granted through promotions or referrals have no cash value and may expire. Megsy reserves the right to modify pricing with 30 days' notice to existing users.`,
  },
  {
    icon: Globe,
    title: "5. Intellectual Property",
    content: `Content you generate using Megsy belongs to you, subject to the following: (a) you must have the right to any input content (images, text) you provide; (b) outputs may not be used to claim that AI-generated content is human-made in regulated contexts; (c) Megsy retains a limited license to use anonymized outputs for model improvement unless you opt out in Settings; (d) the Megsy brand, logo, and platform design are proprietary and may not be reproduced.`,
  },
  {
    icon: AlertTriangle,
    title: "6. Limitation of Liability",
    content: `Megsy is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, accuracy of AI outputs, or fitness for a particular purpose. In no event shall Megsy AI be liable for indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid to Megsy in the 12 months preceding the claim. Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.`,
  },
  {
    icon: Ban,
    title: "7. Termination",
    content: `Either party may terminate the agreement at any time. You may delete your account through Settings. Megsy may suspend or terminate your access for violation of these Terms, non-payment, or extended inactivity (12+ months). Upon termination, your right to use the Service ceases immediately. We may retain anonymized usage data as permitted by our Privacy Policy.`,
  },
  {
    icon: RefreshCw,
    title: "8. Governing Law & Disputes",
    content: `These Terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall be resolved through binding arbitration in Cairo, Egypt, under the rules of the Cairo Regional Centre for International Commercial Arbitration (CRCICA). You agree to waive any right to a jury trial. For EU residents, this does not affect your rights under mandatory consumer protection laws of your country of residence.`,
  },
];

const TermsPage = () => (
  <div data-theme="dark" className="min-h-screen bg-background text-foreground">
    <SEOHead
      title="Terms of Service"
      description="Read Megsy AI's Terms of Service. Understand your rights, obligations, and our policies for using the platform."
      path="/terms"
    />
    <LandingNavbar />

    {/* Hero */}
    <section className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 text-center">
        <h1 className="font-display text-5xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl">
          Terms of <span className="text-primary">Service</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Last updated: March 14, 2026</p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>

    {/* Content */}
    <section className="mx-auto max-w-4xl px-6 pb-28">
      <div className="space-y-8">
        {sections.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/[0.06] bg-card p-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
            </div>
            <p className="text-sm leading-[1.8] text-muted-foreground">{s.content}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-12 rounded-2xl border border-white/[0.06] bg-card p-8 text-center"
      >
        <p className="text-sm text-muted-foreground">
          If you have questions about these Terms, please contact us at{" "}
          <a href="mailto:legal@megsyai.com" className="text-primary hover:underline">legal@megsyai.com</a>
        </p>
      </motion.div>
    </section>

    <LandingFooter />
  </div>
);

export default TermsPage;
