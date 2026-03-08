import { motion } from "framer-motion";

const models = [
  { name: "Megsy V1", flagship: true },
  { name: "Megsy Video", flagship: true },
  { name: "Megsy V1 Image", flagship: true },
  { name: "FLUX Kontext Max", flagship: false },
  { name: "Nano Banana 2", flagship: false },
  { name: "Recraft V4", flagship: false },
  { name: "Ideogram 3", flagship: false },
  { name: "Seedream 5 Lite", flagship: false },
  { name: "FLUX 2 Pro", flagship: false },
  { name: "Veo 3.1", flagship: false },
  { name: "Kling 3.0 Pro", flagship: false },
  { name: "Pika 2.2", flagship: false },
  { name: "Sora", flagship: false },
  { name: "Luma Dream Machine", flagship: false },
  { name: "HiDream I1", flagship: false },
  { name: "OmniGen2", flagship: false },
  { name: "Seedance Pro", flagship: false },
  { name: "PixVerse V5.5", flagship: false },
  { name: "Grok Imagine", flagship: false },
  { name: "ImagineArt 1.5", flagship: false },
];

const ModelsMarquee = () => {
  const items = [...models, ...models];

  return (
    <section id="models" className="relative py-16 overflow-hidden">
      {/* Section title */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 px-6"
      >
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">
          80+ <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Models</span>
        </h2>
        <p className="text-white/40 text-lg max-w-xl mx-auto">
          Access the most comprehensive collection of AI models -- all in one platform.
        </p>
      </motion.div>

      {/* Marquee row 1 */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            {items.map((m, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap ${
                  m.flagship
                    ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                    : "border-white/10 bg-white/[0.03] text-white/50"
                }`}
              >
                {m.flagship && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee row 2 (reverse) */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
        <div className="landing-marquee">
          <div className="landing-marquee-track-reverse">
            {[...items].reverse().map((m, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap ${
                  m.flagship
                    ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                    : "border-white/10 bg-white/[0.03] text-white/50"
                }`}
              >
                {m.flagship && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelsMarquee;
