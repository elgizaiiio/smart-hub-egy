import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background pt-24">
      <div className="pointer-events-none absolute inset-0 select-none">
        <motion.span
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute left-1/2 top-[-6vw] -translate-x-1/2 whitespace-nowrap font-display text-[20vw] font-black uppercase leading-none tracking-tighter text-primary"
        >
          MEGSY AI
        </motion.span>

        <motion.span
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 0.45, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="absolute bottom-[-8vw] left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[19vw] font-black uppercase leading-none tracking-tighter text-primary"
        >
          YOURS TO CREATE
        </motion.span>

        <motion.span
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 0.85, delay: 0.15 }}
          className="absolute left-[-4vw] top-1/2 -translate-y-1/2 font-display text-[14vw] font-black uppercase leading-none tracking-tighter text-primary"
          style={{ writingMode: "vertical-lr", transform: "translateY(-50%) rotate(180deg)" }}
        >
          YOUR IDEAS
        </motion.span>

        <motion.span
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 0.85, delay: 0.2 }}
          className="absolute right-[-4vw] top-1/2 -translate-y-1/2 font-display text-[14vw] font-black uppercase leading-none tracking-tighter text-primary"
          style={{ writingMode: "vertical-lr" }}
        >
          YOUR TOOLS
        </motion.span>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-[12vw] font-black uppercase leading-[0.84] tracking-tighter text-foreground md:text-[8vw]"
        >
          THE CREATOR-FIRST
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="font-display text-[12vw] font-black uppercase leading-[0.84] tracking-tighter text-primary md:text-[8vw]"
        >
          GENERATIVE AI PLATFORM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
          className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Build images, videos, code, and content with massive model coverage and production-level quality.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <FancyButton onClick={() => navigate("/auth")} className="px-10 py-4 text-lg">
            Start now
          </FancyButton>
          <button
            onClick={() => document.getElementById("media-flow")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full border border-border bg-card/40 px-8 py-3.5 text-sm font-semibold text-foreground/90 transition-all hover:border-foreground/35 hover:bg-card"
          >
            Explore Platform
          </button>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
