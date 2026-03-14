import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/SEOHead";
import { Eye, Database, Lock, Globe, Cookie, UserCheck, Mail, Trash2 } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    content: `We collect information you provide directly: account details (email, display name), content you generate (prompts, images, videos), and payment information processed securely via third-party providers. We automatically collect usage data: IP address, device type, browser, pages visited, feature usage, and generation metadata. We do not sell your personal data to third parties.`,
  },
  {
    icon: Eye,
    title: "2. How We Use Your Data",
    content: `Your data is used to: (a) provide and improve the Service; (b) process transactions and manage credits; (c) send service-related communications; (d) detect and prevent fraud or abuse; (e) comply with legal obligations; (f) improve our AI models using anonymized, aggregated data (you can opt out in Settings). We apply data minimization principles — we only collect what's necessary.`,
  },
  {
    icon: Lock,
    title: "3. Data Security",
    content: `We implement industry-standard security measures: TLS 1.3 encryption in transit, AES-256 encryption at rest, regular security audits, and access controls. Our infrastructure is hosted on secure cloud providers with SOC 2 compliance. Despite our efforts, no method of transmission over the internet is 100% secure. We encourage you to use strong, unique passwords and enable two-factor authentication.`,
  },
  {
    icon: Globe,
    title: "4. International Data Transfers",
    content: `Your data may be processed in countries outside your jurisdiction, including Egypt, the United States, and the European Economic Area. We ensure appropriate safeguards through Standard Contractual Clauses (SCCs) and adequacy decisions where applicable. For EU/EEA residents, transfers comply with GDPR requirements.`,
  },
  {
    icon: Cookie,
    title: "5. Cookies & Tracking",
    content: `We use essential cookies for authentication and session management. Analytics cookies (which you can control) help us understand usage patterns. We do not use third-party advertising cookies. You can manage cookie preferences through our Cookie Settings or your browser. See our Cookie Policy for detailed information.`,
  },
  {
    icon: UserCheck,
    title: "6. Your Rights (GDPR & CCPA)",
    content: `You have the right to: (a) access your personal data; (b) correct inaccurate data; (c) delete your data ("right to be forgotten"); (d) restrict processing; (e) data portability; (f) object to processing; (g) withdraw consent. For California residents: you have the right to know what data is collected, request deletion, and opt out of data sales (we do not sell data). Exercise these rights through Settings or by contacting privacy@megsyai.com.`,
  },
  {
    icon: Trash2,
    title: "7. Data Retention",
    content: `We retain your account data for as long as your account is active. Generated content is stored until you delete it or your account. Upon account deletion, personal data is purged within 30 days, except where retention is required by law. Anonymized, aggregated data may be retained indefinitely for analytics and model improvement.`,
  },
  {
    icon: Mail,
    title: "8. Contact & DPO",
    content: `For privacy-related inquiries, contact our Data Protection Officer at privacy@megsyai.com. For EU residents, you have the right to lodge a complaint with your local supervisory authority. We aim to respond to all privacy requests within 30 days.`,
  },
];

const PrivacyPage = () => (
  <div data-theme="dark" className="min-h-screen bg-background text-foreground">
    <SEOHead
      title="Privacy Policy"
      description="Learn how Megsy AI collects, uses, and protects your personal data. GDPR and CCPA compliant."
      path="/privacy"
    />
    <LandingNavbar />

    <section className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 text-center">
        <h1 className="font-display text-5xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl">
          Privacy <span className="text-primary">Policy</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Last updated: March 14, 2026</p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>

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
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 rounded-2xl border border-white/[0.06] bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Questions? Contact our DPO at{" "}
          <a href="mailto:privacy@megsyai.com" className="text-primary hover:underline">privacy@megsyai.com</a>
        </p>
      </motion.div>
    </section>

    <LandingFooter />
  </div>
);

export default PrivacyPage;
