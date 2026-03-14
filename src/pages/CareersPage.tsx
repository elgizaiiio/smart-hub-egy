import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import SEOHead from "@/components/SEOHead";
import { Rocket, Heart, Globe, Zap, Code, Palette, Shield, Users } from "lucide-react";

const values = [
  { icon: Rocket, title: "Move Fast", desc: "We ship weekly. Speed and quality aren't mutually exclusive." },
  { icon: Heart, title: "User Obsession", desc: "Every decision starts with 'How does this help creators?'" },
  { icon: Globe, title: "Global First", desc: "We build for the world. 30+ languages, diverse perspectives." },
  { icon: Zap, title: "AI Native", desc: "We don't just use AI — we live and breathe it every day." },
];

const benefits = [
  "Competitive salary & equity",
  "Remote-first culture",
  "Unlimited PTO",
  "Learning & development budget",
  "Latest hardware & tools",
  "Health & wellness benefits",
  "Team retreats",
  "Early access to cutting-edge AI",
];

const openRoles = [
  { title: "Senior ML Engineer", team: "AI Research", location: "Remote", type: "Full-time" },
  { title: "Full-Stack Developer", team: "Platform", location: "Remote / Cairo", type: "Full-time" },
  { title: "Product Designer", team: "Design", location: "Remote", type: "Full-time" },
  { title: "DevOps Engineer", team: "Infrastructure", location: "Remote", type: "Full-time" },
  { title: "Growth Marketing Lead", team: "Marketing", location: "Remote", type: "Full-time" },
  { title: "Community Manager", team: "Community", location: "Remote", type: "Part-time" },
];

const teamIcons = { "AI Research": Code, Platform: Code, Design: Palette, Infrastructure: Shield, Marketing: Rocket, Community: Users };

const CareersPage = () => {
  const navigate = useNavigate();

  return (
    <div data-theme="dark" className="min-h-screen bg-background text-foreground">
      <SEOHead title="Careers" description="Join the Megsy AI team. We're building the future of AI-powered creativity. Explore open roles in engineering, design, and more." path="/careers" />
      <LandingNavbar />

      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/6 blur-[150px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[120px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="font-display text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="block">Build The</span>
            <span className="block text-primary">Future of AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            We're a small, ambitious team building the world's most powerful AI creative platform. Join us and shape how millions create.
          </p>
          <div className="mt-10">
            <FancyButton onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })} className="text-base">
              View Open Roles
            </FancyButton>
          </div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center font-display text-4xl font-black uppercase md:text-5xl">
          Our <span className="text-primary">Values</span>
        </motion.h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-white/[0.06] bg-card p-8">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3"><v.icon className="h-6 w-6 text-primary" /></div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-white/[0.06] py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center font-display text-4xl font-black uppercase md:text-5xl">
            Perks & <span className="text-primary">Benefits</span>
          </motion.h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <motion.div key={b} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card px-5 py-4">
                <Zap className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="roles" className="border-t border-white/[0.06] py-28">
        <div className="mx-auto max-w-4xl px-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center font-display text-4xl font-black uppercase md:text-5xl">
            Open <span className="text-primary">Roles</span>
          </motion.h2>
          <div className="space-y-4">
            {openRoles.map((role, i) => {
              const Icon = teamIcons[role.team as keyof typeof teamIcons] || Code;
              return (
                <motion.a
                  key={role.title}
                  href={`mailto:careers@megsyai.com?subject=Application: ${role.title}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-card p-6 transition-all hover:border-primary/30 hover:bg-card/80"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{role.title}</h3>
                      <p className="text-sm text-muted-foreground">{role.team}</p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
                    <span>{role.location}</span>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs">{role.type}</span>
                  </div>
                </motion.a>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Don't see a role that fits? We're always looking for exceptional talent.
            </p>
            <FancyButton onClick={() => window.location.href = "mailto:careers@megsyai.com?subject=General Application"} className="text-base">
              Send Open Application
            </FancyButton>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default CareersPage;
