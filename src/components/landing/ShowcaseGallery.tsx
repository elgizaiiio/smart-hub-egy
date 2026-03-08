import { motion } from "framer-motion";
import { useState } from "react";

const roles = [
  {
    label: "Artists",
    description: "Bring imagination to life with bold styles, detailed characters, and concept art ready for refinement.",
    images: [
      { src: "/api-showcase/showcase-1.png", model: "Megsy V1 Image" },
      { src: "/api-showcase/showcase-2.jpg", model: "Nano Banana 2" },
      { src: "/api-showcase/showcase-4.jpg", model: "Recraft V4" },
    ],
  },
  {
    label: "Designers",
    description: "Create product mockups, brand assets, and design explorations at incredible speed.",
    images: [
      { src: "/api-showcase/showcase-3.jpg", model: "FLUX Kontext Max" },
      { src: "/api-showcase/showcase-1.png", model: "Ideogram 3" },
      { src: "/api-showcase/showcase-2.jpg", model: "Seedream 5 Lite" },
    ],
  },
  {
    label: "Animators",
    description: "Turn static ideas into dynamic video content with AI-driven animation and motion tools.",
    images: [
      { src: "/api-showcase/showcase-4.jpg", model: "Megsy Video" },
      { src: "/api-showcase/showcase-3.jpg", model: "Kling 3.0 Pro" },
      { src: "/api-showcase/showcase-1.png", model: "Veo 3.1" },
    ],
  },
  {
    label: "Photographers",
    description: "Enhance, upscale, and refine photos with professional-grade AI tools.",
    images: [
      { src: "/api-showcase/showcase-2.jpg", model: "Megsy V1 Image" },
      { src: "/api-showcase/showcase-4.jpg", model: "FLUX 2 Pro" },
      { src: "/api-showcase/showcase-3.jpg", model: "HiDream I1" },
    ],
  },
  {
    label: "Marketers",
    description: "Generate campaign visuals, social media content, and ad creatives at scale.",
    images: [
      { src: "/api-showcase/showcase-1.png", model: "GPT Image 1.5" },
      { src: "/api-showcase/showcase-3.jpg", model: "ImagineArt 1.5" },
      { src: "/api-showcase/showcase-2.jpg", model: "OmniGen2" },
    ],
  },
  {
    label: "Developers",
    description: "Build full-stack applications, generate code, and deploy with AI-powered tools.",
    images: [
      { src: "/api-showcase/showcase-3.jpg", model: "Megsy V1" },
      { src: "/api-showcase/showcase-4.jpg", model: "GPT-5" },
      { src: "/api-showcase/showcase-1.png", model: "DeepSeek R1" },
    ],
  },
];

const ShowcaseGallery = () => {
  const [activeRole, setActiveRole] = useState(0);
  const currentRole = roles[activeRole];

  return (
    <section className="relative overflow-hidden py-24 md:py-40">
      {/* Giant "BUILT FOR MAKERS" text */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mx-auto max-w-[95vw] px-6 text-center mb-10"
      >
        <h2 className="font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[10vw]">
          BUILT FOR
        </h2>
        <h2 className="font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[10vw]">
          <span className="inline-flex items-center gap-[2vw]">
            {/* Purple icon placeholder */}
            <span className="inline-flex h-[8vw] w-[6vw] items-center justify-center rounded-2xl bg-purple-500 md:h-[6vw] md:w-[5vw]">
              <svg viewBox="0 0 24 24" fill="white" className="h-[4vw] w-[4vw] md:h-[3vw] md:w-[3vw]">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </span>
            MAKERS
          </span>
        </h2>
      </motion.div>

      {/* Role tabs */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mx-auto max-w-6xl px-6 mb-6"
      >
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-2 md:gap-0 md:justify-between">
          {roles.map((role, i) => (
            <button
              key={role.label}
              onClick={() => setActiveRole(i)}
              className={`rounded-full px-6 py-2.5 text-base font-bold uppercase tracking-wider transition-all md:text-lg ${
                activeRole === i
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Description */}
      <motion.p
        key={activeRole}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-2xl px-6 text-center text-lg text-white/50 mb-10"
      >
        {currentRole.description}
      </motion.p>

      {/* Image grid */}
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {currentRole.images.map((img, i) => (
            <motion.div
              key={`${activeRole}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl"
            >
              <img
                src={img.src}
                alt={img.model}
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 pt-20">
                <p className="text-sm font-bold text-white">{img.model}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShowcaseGallery;
