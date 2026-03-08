import { motion } from "framer-motion";

const tools = [
  {
    title: "AI Image Generator",
    description: "Create stunning visuals with 20+ specialized models. From photorealistic to artistic styles.",
    image: "/api-showcase/showcase-1.png",
  },
  {
    title: "AI Video Generator",
    description: "Transform text and images into cinematic video sequences with Megsy Video engine.",
    image: "/api-showcase/showcase-2.jpg",
  },
  {
    title: "AI Code Builder",
    description: "Build, deploy, and iterate on full-stack applications with live preview and GitHub sync.",
    image: "/api-showcase/showcase-3.jpg",
  },
  {
    title: "AI Image Tools",
    description: "18+ professional tools: upscale, relight, remove backgrounds, restore photos, and more.",
    image: "/api-showcase/showcase-4.jpg",
  },
  {
    title: "AI Chat Assistant",
    description: "Multi-model conversations with web search, file analysis, and persistent memory.",
    image: "/api-showcase/showcase-1.png",
  },
];

const ShowcaseGallery = () => {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="font-display text-6xl font-black uppercase tracking-tighter leading-none text-white md:text-8xl lg:text-9xl">
            EXPLORE
          </h2>
          <h2 className="font-display text-6xl font-black uppercase tracking-tighter leading-none md:text-8xl lg:text-9xl">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              MORE AI TOOLS
            </span>
          </h2>
        </motion.div>

        <div className="scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 70, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="group w-[320px] flex-shrink-0 snap-center md:w-[400px]"
            >
              <div className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:border-white/20">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={tool.image}
                    alt={tool.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="p-7">
                  <h3 className="mb-2 font-display text-xl font-bold text-white">{tool.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{tool.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseGallery;
