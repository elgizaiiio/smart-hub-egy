import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black">
      {/* Massive perspective text wall — like Leonardo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden">
        {/* Top text — comes from above */}
        <motion.span
          initial={{ opacity: 0, y: -300, rotateX: 60 }}
          animate={{ opacity: 0.15, y: -120, rotateX: 12 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="absolute text-[28vw] font-black uppercase leading-none tracking-tighter text-purple-500"
          style={{ fontFamily: "var(--font-display)" }}
        >
          MEGSY
        </motion.span>

        {/* Left — rotated */}
        <motion.span
          initial={{ opacity: 0, x: -400 }}
          animate={{ opacity: 0.12, x: -80 }}
          transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
          className="absolute left-[-8vw] text-[16vw] font-black uppercase leading-none tracking-tighter text-purple-500"
          style={{ fontFamily: "var(--font-display)", writingMode: "vertical-lr", transform: "rotate(180deg)" }}
        >
          YOUR IDEAS
        </motion.span>

        {/* Right — rotated */}
        <motion.span
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 0.12, x: 80 }}
          transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
          className="absolute right-[-8vw] text-[16vw] font-black uppercase leading-none tracking-tighter text-purple-500"
          style={{ fontFamily: "var(--font-display)", writingMode: "vertical-lr" }}
        >
          YOUR TOOLS
        </motion.span>

        {/* Bottom — comes from below */}
        <motion.span
          initial={{ opacity: 0, y: 300, rotateX: -60 }}
          animate={{ opacity: 0.07, y: 140, rotateX: -8 }}
          transition={{ duration: 1.6, delay: 0.15, ease: "easeOut" }}
          className="absolute text-[22vw] font-black uppercase leading-none tracking-tighter text-purple-500"
          style={{ fontFamily: "var(--font-display)" }}
        >
          TO CREATE
        </motion.span>
      </div>

      {/* Gradient orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/25 blur-[160px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-600/20 blur-[140px]"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
        >
          <h1 className="font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[9vw]">
            THE CREATOR-FIRST
          </h1>
          <h1 className="font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tighter md:text-[9vw]">
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI PLATFORM
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl"
        >
          Generate stunning images, cinematic videos, intelligent conversations,
          and production-ready code with 80+ AI models in one unified platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <FancyButton onClick={() => navigate("/auth")} className="px-10 py-4 text-lg">
            Start Creating Free
          </FancyButton>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white"
          >
            Explore Platform
          </button>
        </motion.div>

        {/* Showcase images */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="grid grid-cols-3 gap-3">
            <motion.img
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.4 }}
              src="/api-showcase/showcase-1.png"
              alt="AI Generated Art"
              className="h-48 w-full rounded-2xl object-cover opacity-80 md:h-72"
            />
            <motion.img
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.4 }}
              src="/api-showcase/showcase-2.jpg"
              alt="AI Generated Art"
              className="mt-8 h-48 w-full rounded-2xl object-cover opacity-80 md:h-72"
            />
            <motion.img
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.4 }}
              src="/api-showcase/showcase-3.jpg"
              alt="AI Generated Art"
              className="h-48 w-full rounded-2xl object-cover opacity-80 md:h-72"
            />
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
};

export default HeroSection;
