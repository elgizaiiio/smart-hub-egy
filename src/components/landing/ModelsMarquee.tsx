import { motion } from "framer-motion";

const services = [
  { name: "AI Chat", highlight: true },
  { name: "Image Generation", highlight: true },
  { name: "Video Creation", highlight: true },
  { name: "Code & Deploy", highlight: true },
  { name: "Web Search" },
  { name: "File Analysis" },
  { name: "Email Sending" },
  { name: "Document Summary" },
  { name: "Translation" },
  { name: "Data Extraction" },
  { name: "GitHub Integration" },
  { name: "One-Click Deploy" },
  { name: "Memory & Context" },
  { name: "Multi-Model Access" },
  { name: "Real-Time Preview" },
  { name: "Image Editing" },
  { name: "Video Animation" },
  { name: "Task Automation" },
];

const providers = [
  "Google",
  "OpenAI",
  "Anthropic",
  "Stability AI",
  "Runway",
  "Meta",
];

const ModelsMarquee = () => {
  const items = [...services, ...services];

  return (
    <section id="models" className="relative overflow-hidden py-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-6 px-6 text-center"
      >
        <p className="mx-auto max-w-xl text-base text-muted-foreground md:text-lg">
          From freelancers to global teams, Megsy is trusted to turn ideas into polished, professional work.
        </p>
      </motion.div>

      {/* Logos row */}
      <div className="mx-auto mb-16 flex max-w-5xl items-center justify-center gap-10 px-6 md:gap-20">
        {logos.map((logo) => (
          <span key={logo} className="text-lg font-black uppercase tracking-wider text-foreground/20 md:text-2xl">
            {logo}
          </span>
        ))}
      </div>

      {/* Services heading */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-12 px-6 text-center"
      >
        <h2 className="font-display text-5xl font-black uppercase tracking-tighter text-foreground md:text-8xl">
          EVERYTHING YOU{" "}
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">NEED</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          All-in-one AI platform — chat, create, code, and automate.
        </p>
      </motion.div>

      {/* Row 1 */}
      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            {items.map((s, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-bold uppercase tracking-wider ${
                  s.highlight ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                {s.highlight && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 reverse */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="landing-marquee">
          <div className="landing-marquee-track-reverse">
            {[...items].reverse().map((s, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-bold uppercase tracking-wider ${
                  s.highlight ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                {s.highlight && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelsMarquee;
