import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import FancyButton from "@/components/FancyButton";

const floatingImages = [
  { src: "/api-showcase/showcase-1.png", className: "left-[5%] top-[12%] w-[220px] md:w-[280px]", delay: 0 },
  { src: "/api-showcase/showcase-2.jpg", className: "right-[3%] top-[18%] w-[200px] md:w-[260px]", delay: 0.15 },
  { src: "/api-showcase/showcase-3.jpg", className: "left-[8%] bottom-[22%] w-[180px] md:w-[240px]", delay: 0.3 },
  { src: "/api-showcase/showcase-4.jpg", className: "right-[6%] bottom-[15%] w-[210px] md:w-[270px]", delay: 0.1 },
  { src: "/api-showcase/showcase-1.png", className: "right-[22%] top-[8%] w-[160px] md:w-[200px]", delay: 0.25 },
  { src: "/api-showcase/showcase-2.jpg", className: "left-[20%] bottom-[8%] w-[170px] md:w-[220px]", delay: 0.2 },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1, 2.5]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black pt-16">
      {/* 3D Perspective text room - like Leonardo.ai */}
      <div className="pointer-events-none absolute inset-0 select-none" style={{ perspective: "800px" }}>
        {/* Top wall */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden"
          style={{ height: "45%", transformOrigin: "bottom center", transform: "rotateX(45deg)" }}
        >
          <span className="whitespace-nowrap text-[20vw] font-black uppercase leading-none tracking-tighter text-purple-500/50" style={{ fontFamily: "var(--font-display)" }}>
            MEGSY AI
          </span>
        </motion.div>

        {/* Bottom wall */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.1 }}
          className="absolute inset-x-0 bottom-0 flex items-start justify-center overflow-hidden"
          style={{ height: "45%", transformOrigin: "top center", transform: "rotateX(-45deg)" }}
        >
          <span className="whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tighter text-purple-500/40" style={{ fontFamily: "var(--font-display)" }}>
            YOURS TO CREATE
          </span>
        </motion.div>

        {/* Left wall */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute left-0 top-0 bottom-0 flex items-center justify-end overflow-hidden"
          style={{ width: "35%", transformOrigin: "right center", transform: "rotateY(-40deg)" }}
        >
          <span className="whitespace-nowrap text-[16vw] font-black uppercase leading-none tracking-tighter text-purple-500/35" style={{ fontFamily: "var(--font-display)", writingMode: "vertical-lr", transform: "rotate(180deg)" }}>
            YOUR IDEAS
          </span>
        </motion.div>

        {/* Right wall */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-start overflow-hidden"
          style={{ width: "35%", transformOrigin: "left center", transform: "rotateY(40deg)" }}
        >
          <span className="whitespace-nowrap text-[16vw] font-black uppercase leading-none tracking-tighter text-purple-500/35" style={{ fontFamily: "var(--font-display)", writingMode: "vertical-lr" }}>
            YOUR TOOLS
          </span>
        </motion.div>
      </div>

      {/* Floating images that scale & fade on scroll */}
      {floatingImages.map((img, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6, y: 60 }}
          animate={{ opacity: 0.85, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 + img.delay }}
          className={`absolute ${img.className} z-[5] hidden md:block`}
          style={{ scale: imageScale, opacity: imageOpacity }}
        >
          <img
            src={img.src}
            alt="AI Generated"
            className="rounded-2xl shadow-2xl shadow-black/50 object-cover aspect-[4/5]"
            loading="lazy"
          />
        </motion.div>
      ))}

      {/* Center content */}
      <motion.div className="relative z-10 mx-auto max-w-4xl px-6 text-center" style={{ y: textY }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
            THE CREATOR-FIRST
          </h1>
          <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              GENERATIVE AI PLATFORM
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <FancyButton onClick={() => navigate("/auth")} className="px-10 py-4 text-lg">
            Start now
          </FancyButton>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full border border-white/30 bg-black/50 px-8 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/5"
          >
            Explore Platform
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-20" />
    </section>
  );
};

export default HeroSection;
