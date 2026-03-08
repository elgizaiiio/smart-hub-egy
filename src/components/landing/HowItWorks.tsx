import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds. Get free credits to start exploring all 80+ AI models immediately.",
    color: "border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5",
    numColor: "text-emerald-400",
  },
  {
    number: "02",
    title: "Choose Your Tool",
    description: "Select from AI Chat, Image Generation, Video Creation, Code Building, and 18+ professional image tools.",
    color: "border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-amber-500/5",
    numColor: "text-amber-400",
  },
  {
    number: "03",
    title: "Pick Your Model",
    description: "Access 80+ AI models including Megsy's flagship models, each optimized for specific creative tasks.",
    color: "border-rose-500/30 bg-gradient-to-r from-rose-500/15 to-rose-500/5",
    numColor: "text-rose-400",
  },
  {
    number: "04",
    title: "Create & Iterate",
    description: "Generate, edit, and refine your content. Use advanced tools to upscale, restyle, and perfect results.",
    color: "border-purple-500/30 bg-gradient-to-r from-purple-500/15 to-purple-500/5",
    numColor: "text-purple-400",
  },
  {
    number: "05",
    title: "Export & Deploy",
    description: "Download in any format, deploy code projects live, or share directly to social platforms.",
    color: "border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-cyan-500/5",
    numColor: "text-cyan-400",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="lg:w-1/3 lg:sticky lg:top-32 lg:self-start"
          >
            <h2 className="mb-6 font-display text-6xl font-black uppercase tracking-tighter leading-none text-white md:text-8xl">
              HOW IT{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">WORKS</span>
            </h2>
            <p className="text-lg text-white/40">From signup to deployment in five simple steps.</p>
          </motion.div>

          <div className="space-y-6 lg:w-2/3">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 100, rotateY: -8 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              >
                <div className={`rounded-2xl border p-8 transition-transform duration-300 hover:scale-[1.02] md:p-10 ${step.color}`}>
                  <div className="flex items-start gap-6">
                    <span className={`text-6xl font-black leading-none opacity-60 md:text-7xl ${step.numColor}`}>
                      {step.number}
                    </span>
                    <div>
                      <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-white/50 md:text-base">{step.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
