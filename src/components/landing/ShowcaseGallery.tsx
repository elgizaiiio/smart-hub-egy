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
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mx-auto mb-10 max-w-[95vw] px-6 text-center"
      >
        <h2 className="font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[10vw]">
          BUILT FOR MAKERS
        </h2>
      </motion.div>

      <div className="mx-auto mb-6 max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-card/40 p-2 md:justify-between">
          {roles.map((role, i) => (
            <button
              key={role.label}
              onClick={() => setActiveRole(i)}
              className={`rounded-full px-6 py-2.5 text-base font-bold uppercase tracking-wider transition-all md:text-lg ${
                activeRole === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      <motion.p key={activeRole} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mb-10 max-w-2xl px-6 text-center text-lg text-muted-foreground">
        {currentRole.description}
      </motion.p>

      <div className="mx-auto max-w-7xl px-6">
        <motion.div key={activeRole} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {currentRole.images.map((img, i) => (
            <motion.div
              key={`${activeRole}-${i}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border"
            >
              <img src={img.src} alt={img.model} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 to-transparent p-6 pt-20">
                <p className="text-sm font-bold text-foreground">{img.model}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShowcaseGallery;
