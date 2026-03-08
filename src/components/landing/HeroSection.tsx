import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import ModelBrandIcon from "@/components/landing/ModelBrandIcon";

const spotlightModels = [
  { id: "megsy-v1", name: "Megsy V1" },
  { id: "megsy-v1-img", name: "Megsy V1 Image" },
  { id: "megsy-video", name: "Megsy Video" },
  { id: "openai/gpt-5", name: "GPT-5" },
  { id: "x-ai/grok-3", name: "Grok 3" },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-24">
      <div className="landing-grid-overlay absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <motion.span
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="landing-hero-word absolute -top-[2vw] left-1/2 -translate-x-1/2 text-[24vw] leading-none text-primary"
        >
          MEGSY
        </motion.span>

        <motion.span
          initial={{ opacity: 0, x: -120 }}
          animate={{ opacity: 0.45, x: 0 }}
          transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
          className="landing-hero-word absolute left-[-11vw] top-1/2 -translate-y-1/2 rotate-[-90deg] text-[14vw] leading-none text-primary"
        >
          YOUR IDEAS
        </motion.span>

        <motion.span
          initial={{ opacity: 0, x: 120 }}
          animate={{ opacity: 0.45, x: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
          className="landing-hero-word absolute right-[-11vw] top-1/2 -translate-y-1/2 rotate-90 text-[14vw] leading-none text-primary"
        >
          TOOLS
        </motion.span>

        <motion.span
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ duration: 1.1, delay: 0.25, ease: "easeOut" }}
          className="landing-hero-word absolute -bottom-[3vw] left-1/2 -translate-x-1/2 text-[19vw] leading-none text-primary"
        >
          CREATE
        </motion.span>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-foreground/70"
        >
          Creator-first AI Platform
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-[11vw] font-black uppercase leading-[0.88] tracking-tight text-foreground md:text-[8vw]"
        >
          THE ALL-IN-ONE
          <br />
          AI CREATIVE PLATFORM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-xl"
        >
          Megsy يجمع الدردشة الذكية، صناعة الصور، الفيديو، التعديل الاحترافي، وبناء التطبيقات في تجربة واحدة متكاملة
          تشرح وتنفذ وتنتج من فكرة واحدة حتى النتيجة النهائية.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <FancyButton onClick={() => navigate("/auth")} className="px-8 py-3 text-base">
            Start Creating
          </FancyButton>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-xl border border-border bg-secondary/40 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
          >
            Explore Full Platform
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {spotlightModels.map((model) => (
            <span
              key={model.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold text-foreground"
            >
              <ModelBrandIcon modelId={model.id} className="h-4 w-4" />
              {model.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
