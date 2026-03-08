import { motion } from "framer-motion";
import { ArrowRight, Image, Video, Code, Wand2, MessageSquare } from "lucide-react";

const tools = [
  {
    title: "AI Image Generator",
    description: "Create stunning visuals with 20+ specialized models. From photorealistic to artistic styles.",
    image: "/api-showcase/showcase-1.png",
    icon: Image,
    color: "from-pink-500 to-rose-600",
  },
  {
    title: "AI Video Generator",
    description: "Transform text and images into cinematic video sequences with Megsy Video engine.",
    image: "/api-showcase/showcase-2.jpg",
    icon: Video,
    color: "from-violet-500 to-purple-600",
  },
  {
    title: "AI Code Builder",
    description: "Build, deploy, and iterate on full-stack applications with live preview.",
    image: "/api-showcase/showcase-3.jpg",
    icon: Code,
    color: "from-emerald-500 to-green-600",
  },
  {
    title: "AI Image Tools",
    description: "18+ professional tools: upscale, relight, remove backgrounds, restore photos, and more.",
    image: "/api-showcase/showcase-4.jpg",
    icon: Wand2,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "AI Chat Assistant",
    description: "Multi-model conversations with web search, file analysis, and memory.",
    image: "/api-showcase/showcase-1.png",
    icon: MessageSquare,
    color: "from-cyan-500 to-blue-600",
  },
];

const ShowcaseGallery = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Yellow/amber accent bg like Leonardo */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-2">
            <span className="text-white">EXPLORE</span>
          </h2>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              MORE AI TOOLS
            </span>
          </h2>
        </motion.div>

        {/* Horizontal scrollable cards */}
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="flex-shrink-0 w-[320px] md:w-[380px] snap-center group"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all duration-500 h-full">
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={tool.image}
                    alt={tool.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className={`absolute top-4 left-4 p-2 rounded-xl bg-gradient-to-br ${tool.color} shadow-lg`}>
                    <tool.icon size={20} className="text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-xl mb-2">{tool.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">{tool.description}</p>
                  <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Learn more <ArrowRight size={14} />
                  </span>
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
