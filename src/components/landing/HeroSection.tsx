import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const heroVideos = [
  { src: "/hero/video-1.mp4", rotate: -6, y: 40 },
  { src: "/hero/video-2.mp4", rotate: -3, y: 15 },
  { src: "/hero/video-4.mp4", rotate: 0, y: 0, center: true },
  { src: "/hero/video-3.mp4", rotate: 3, y: 15 },
  { src: "/hero/bear.mp4", rotate: 6, y: 40 },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background pt-24 pb-0">
      {/* Title */}
      <div className="relative z-30 mx-auto w-full px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display text-[9vw] uppercase leading-[1] tracking-tight text-foreground md:text-[5.5vw]"
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

      {/* Video cards — evenly spaced fan layout */}
      <div className="relative z-0 mt-10 flex w-full max-w-[1500px] items-end justify-center gap-3 px-4 pb-4 md:gap-5">
        {heroVideos.map((vid, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100, rotate: vid.rotate }}
            animate={{ opacity: 1, y: vid.y, rotate: vid.rotate }}
            transition={{ duration: 0.7, delay: 0.45 + i * 0.1, ease: "easeOut" }}
            className={`relative overflow-hidden rounded-2xl border border-border/30 shadow-2xl ${
              vid.center
                ? "w-[22%] md:w-[20%] z-[3]"
                : Math.abs(vid.rotate) <= 3
                ? "w-[19%] md:w-[18%] z-[2]"
                : "w-[16%] md:w-[15%] z-[1]"
            }`}
            style={{ aspectRatio: "3/4" }}
          >
            <video
              src={vid.src}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </motion.div>
        ))}
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
