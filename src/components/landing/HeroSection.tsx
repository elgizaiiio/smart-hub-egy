import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import { Star } from "lucide-react";

const heroImages = [
  { src: "/hero/video-1.mp4", type: "video", style: "left-[2%] bottom-[15%] w-[17%] z-[1] rotate-[-7deg]" },
  { src: "/hero/video-2.mp4", type: "video", style: "left-[19%] bottom-[4%] w-[19%] z-[2] rotate-[-3deg]" },
  { src: "/hero/bear.mp4", type: "video", style: "left-[38%] bottom-[0%] w-[24%] z-[3]" },
  { src: "/hero/video-3.mp4", type: "video", style: "left-[62%] bottom-[4%] w-[19%] z-[2] rotate-[3deg]" },
  { src: "/hero/video-4.mp4", type: "video", style: "left-[81%] bottom-[15%] w-[17%] z-[1] rotate-[7deg]" },
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
          <FancyButton onClick={() => window.open("https://api.megsyai.com", "_blank")} className="px-10 py-4 text-base">
            API Platform
          </FancyButton>
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
