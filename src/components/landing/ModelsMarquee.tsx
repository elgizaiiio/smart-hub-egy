import { motion } from "framer-motion";

const models = [
  { name: "Megsy V1", flagship: true },
  { name: "Megsy Video", flagship: true },
  { name: "Megsy V1 Image", flagship: true },
  { name: "FLUX Kontext Max" },
  { name: "Nano Banana 2" },
  { name: "Recraft V4" },
  { name: "Ideogram 3" },
  { name: "Seedream 5 Lite" },
  { name: "FLUX 2 Pro" },
  { name: "Veo 3.1" },
  { name: "Kling 3.0 Pro" },
  { name: "Pika 2.2" },
  { name: "Sora" },
  { name: "Luma Dream Machine" },
  { name: "HiDream I1" },
  { name: "OmniGen2" },
  { name: "Seedance Pro" },
  { name: "PixVerse V5.5" },
  { name: "Grok Imagine" },
  { name: "ImagineArt 1.5" },
  { name: "GPT-5" },
  { name: "GPT Image 1.5" },
  { name: "Gemini 2.5 Pro" },
  { name: "Grok 3" },
  { name: "DeepSeek R1" },
];

const ModelsMarquee = () => {
  const items = [...models, ...models];

  return (
    <section id="models" className="relative overflow-hidden py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-12 px-6 text-center"
      >
        <h2 className="font-display text-6xl font-black uppercase tracking-tighter text-white md:text-8xl">
          80+ <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Models</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/40">
          Access the most comprehensive collection of AI models -- all in one platform.
        </p>
      </motion.div>

      {/* Row 1 */}
      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-black to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            {items.map((m, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-medium ${
                  m.flagship
                    ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                    : "border-white/10 bg-white/[0.03] text-white/50"
                }`}
              >
                {m.flagship && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />}
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 reverse */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-black to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track-reverse">
            {[...items].reverse().map((m, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-medium ${
                  m.flagship
                    ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                    : "border-white/10 bg-white/[0.03] text-white/50"
                }`}
              >
                {m.flagship && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />}
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
