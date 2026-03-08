const models = [
  { name: "Megsy V1", flagship: true },
  { name: "Megsy Video", flagship: true },
  { name: "Megsy V1 Image", flagship: true },
  { name: "GPT-5" },
  { name: "GPT Image 1.5" },
  { name: "Gemini 2.5 Pro" },
  { name: "Grok 3" },
  { name: "Grok Imagine" },
  { name: "DeepSeek R1" },
  { name: "FLUX Kontext Max" },
  { name: "FLUX 2 Pro" },
  { name: "Nano Banana 2" },
  { name: "Recraft V4" },
  { name: "Ideogram 3" },
  { name: "Seedream 5 Lite" },
  { name: "OmniGen2" },
  { name: "HiDream I1" },
  { name: "ImagineArt 1.5" },
  { name: "Veo 3.1" },
  { name: "Sora" },
  { name: "Kling 3.0 Pro" },
  { name: "Pika 2.2" },
  { name: "Luma Dream Machine" },
  { name: "Seedance Pro" },
  { name: "PixVerse V5.5" },
];

const StatsMarquee = () => {
  const items = [...models, ...models, ...models];

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-5">
      <div className="landing-marquee">
        <div className="landing-marquee-track">
          {items.map((m, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-2.5 whitespace-nowrap text-sm font-medium uppercase tracking-widest ${
                m.flagship ? "text-purple-300" : "text-white/35"
              }`}
            >
              {m.flagship && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />}
              {m.name}
              <span className="h-1 w-1 rounded-full bg-white/20" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsMarquee;
