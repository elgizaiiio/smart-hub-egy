import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import { Star } from "lucide-react";

const heroImages = [
  { src: "/hero/video-1.mp4", type: "video", style: "left-[1%] bottom-[6%] w-[18%] z-0 rotate-[-5deg]" },
  { src: "/hero/video-2.mp4", type: "video", style: "left-[14%] bottom-[0%] w-[24%] z-10 rotate-[2deg]" },
  { src: "/hero/bear.mp4", type: "video", style: "left-1/2 -translate-x-1/2 bottom-[2%] w-[32%] z-20" },
  { src: "/hero/video-3.mp4", type: "video", style: "right-[14%] bottom-[0%] w-[24%] z-10 rotate-[-2deg]" },
  { src: "/hero/video-4.mp4", type: "video", style: "right-[1%] bottom-[6%] w-[18%] z-0 rotate-[5deg]" },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background pt-20 pb-0">
      {/* Title */}
      <div className="relative z-30 mx-auto max-w-6xl px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display text-[9vw] font-black uppercase leading-[0.88] tracking-tighter text-foreground md:text-[5.5vw]"
        >
          THE AI CREATIVE SUITE{" "}
          <span className="text-primary">THAT PUTS YOU IN CONTROL</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          Generate images, animate stills, build code, and create with precision
          and control across 80+ AI models and professional workflows.
        </motion.p>

        {/* Rating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-5 flex items-center justify-center gap-2"
        >
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
            ))}
          </div>
          <span className="text-sm font-bold text-foreground">4.8</span>
          <span className="text-xs text-muted-foreground">based on 92K Ratings</span>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <FancyButton onClick={() => navigate("/auth")} className="px-10 py-4 text-base">
            Start creating
          </FancyButton>
          <button
            onClick={() => navigate("/pricing")}
            className="rounded-full border border-border bg-card/40 px-8 py-3.5 text-sm font-semibold text-foreground/90 backdrop-blur-md transition-all hover:border-foreground/30 hover:bg-card"
          >
            View API & Pricing
          </button>
        </motion.div>
      </div>

      {/* Floating image cards — Leonardo.ai style spread at bottom */}
      <div className="relative z-0 mt-14 h-[34vh] w-full min-h-[240px] max-w-[1600px] px-2 md:h-[40vh]">
        {heroImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 + i * 0.08 }}
            className={`absolute aspect-[4/5] overflow-hidden rounded-2xl border border-border/40 bg-card/20 shadow-2xl ${img.style}`}
          >
            {img.type === "video" ? (
              <video
                src={img.src}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={img.src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
