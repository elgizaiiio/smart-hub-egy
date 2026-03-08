import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import FancyButton from "@/components/FancyButton";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 60, -100, 0],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/15 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 60, -80, 0],
            y: [0, -40, 80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-fuchsia-500/10 blur-[80px]"
        />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Powered by 80+ AI Models
          </span>
        </motion.div>

        {/* Giant Title */}
        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="text-[12vw] md:text-[8vw] lg:text-[7vw] font-black uppercase leading-[0.9] tracking-tighter mb-2"
        >
          <span className="text-white">THE ALL-IN-ONE</span>
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="text-[12vw] md:text-[8vw] lg:text-[7vw] font-black uppercase leading-[0.9] tracking-tighter mb-8"
        >
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            AI CREATIVE PLATFORM
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Generate stunning images, cinematic videos, intelligent conversations,
          and production-ready code -- all from one platform with Megsy's
          proprietary AI models.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <FancyButton onClick={() => navigate("/auth")} className="text-lg px-8 py-3">
            <span className="flex items-center gap-2">
              Start Creating Free <ArrowRight size={18} />
            </span>
          </FancyButton>
          <button
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white border border-white/15 hover:border-white/30 rounded-xl px-6 py-3 transition-all duration-300"
          >
            <Play size={16} /> Watch Demo
          </button>
        </motion.div>

        {/* Floating showcase images */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.3 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <div className="grid grid-cols-3 gap-3 opacity-80">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src="/api-showcase/showcase-1.png"
                alt="AI Generated Art"
                className="rounded-2xl w-full h-48 md:h-64 object-cover"
              />
              <motion.img
                whileHover={{ scale: 1.05 }}
                src="/api-showcase/showcase-2.jpg"
                alt="AI Generated Art"
                className="rounded-2xl w-full h-48 md:h-64 object-cover mt-8"
              />
              <motion.img
                whileHover={{ scale: 1.05 }}
                src="/api-showcase/showcase-3.jpg"
                alt="AI Generated Art"
                className="rounded-2xl w-full h-48 md:h-64 object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
};

export default HeroSection;
