import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import { Code, Sparkles, Rocket, Terminal, ArrowRight } from "lucide-react";

const features = [
  { icon: Terminal, title: "AI Code Generation", desc: "Describe what you want to build and Megsy Pro writes production-ready code." },
  { icon: Code, title: "Full-Stack Apps", desc: "Build complete web applications with frontend, backend, and database — all from chat." },
  { icon: Rocket, title: "One-Click Deploy", desc: "Deploy your apps instantly to the cloud with automatic hosting and SSL." },
  { icon: Sparkles, title: "Smart Debugging", desc: "Megsy Pro identifies bugs, suggests fixes, and optimizes your code automatically." },
];

const ServiceCodePage = () => {
  const navigate = useNavigate();

  return (
    <div data-theme="dark" className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Powered by Megsy Pro
          </span>
          <h1 className="font-display mt-4 text-5xl font-black uppercase leading-tight tracking-tight md:text-7xl">
            Code<br />
            <span className="text-primary">Builder</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Build and deploy full-stack web applications using natural language.
            Megsy Pro writes, debugs, and deploys your code — no experience needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <FancyButton onClick={() => navigate("/auth")} className="text-base px-8 py-3">
              Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
            </FancyButton>
            <button onClick={() => navigate("/#pricing")} className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-foreground/40">
              View Pricing
            </button>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-10 md:p-16">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <h2 className="font-display text-3xl font-black uppercase md:text-4xl">
                Why <span className="text-primary">Megsy Pro</span>?
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Megsy Pro understands modern frameworks, best practices, and security patterns.
                It generates clean, maintainable code that's ready for production.
              </p>
              <ul className="mt-6 space-y-3">
                {["React, Node.js, Python & more", "Automatic error handling", "Live preview while building", "One-click cloud deployment"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] md:w-80">
              <Code className="h-16 w-16 text-primary/40" />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-center text-3xl font-black uppercase md:text-4xl">Everything You Need</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-colors hover:border-primary/20 hover:bg-primary/[0.03]">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-black uppercase md:text-5xl">Ready to Build?</h2>
        <p className="mt-4 text-muted-foreground">Turn your ideas into apps with Megsy Pro — no coding required.</p>
        <FancyButton onClick={() => navigate("/auth")} className="mt-8 text-base px-10 py-3">Get Started Free</FancyButton>
      </section>

      <LandingFooter />
    </div>
  );
};

export default ServiceCodePage;
