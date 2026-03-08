import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import FancyButton from "@/components/FancyButton";

const HeroSection = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const wallDrift = useTransform(scrollYProgress, [0, 1], [0, -36]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background pt-24">
      <div className="pointer-events-none absolute inset-0" style={{ perspective: "900px" }}>
        <motion.div
          style={{ y: wallDrift }}
          className="absolute inset-x-0 top-0 flex h-[44%] items-end justify-center overflow-hidden"
        >
          <span
            className="whitespace-nowrap font-display text-[22vw] font-black uppercase leading-none tracking-tighter text-primary/50"
            style={{ transformOrigin: "bottom center", transform: "rotateX(46deg)" }}
          >
            MEGSY AI
          </span>
        </motion.div>

        <motion.div
          style={{ y: wallDrift }}
          className="absolute inset-x-0 bottom-0 flex h-[44%] items-start justify-center overflow-hidden"
        >
          <span
            className="whitespace-nowrap font-display text-[20vw] font-black uppercase leading-none tracking-tighter text-primary/40"
            style={{ transformOrigin: "top center", transform: "rotateX(-46deg)" }}
          >
            YOURS TO CREATE
          </span>
        </motion.div>

        <div className="absolute left-0 top-0 bottom-0 flex w-[32%] items-center justify-end overflow-hidden">
          <span
            className="font-display text-[16vw] font-black uppercase leading-none tracking-tighter text-primary/35"
            style={{ writingMode: "vertical-lr", transform: "rotate(180deg) rotateY(-42deg)" }}
          >
            YOUR IDEAS
          </span>
        </div>

        <div className="absolute right-0 top-0 bottom-0 flex w-[32%] items-center justify-start overflow-hidden">
          <span
            className="font-display text-[16vw] font-black uppercase leading-none tracking-tighter text-primary/35"
            style={{ writingMode: "vertical-lr", transform: "rotateY(42deg)" }}
          >
            YOUR TOOLS
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[8vw]"
        >
          THE CREATOR-FIRST
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1 }}
          className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter text-primary md:text-[8vw]"
        >
          GENERATIVE AI PLATFORM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Build images, videos, code, and content with massive model coverage and production-level quality.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
