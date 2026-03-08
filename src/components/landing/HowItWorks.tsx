import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds with email or social login. Get free credits to start exploring.",
    color: "from-emerald-500/20 to-emerald-500/5",
    borderColor: "border-emerald-500/30",
    numberColor: "text-emerald-400",
  },
  {
    number: "02",
    title: "Choose Your Tool",
    description: "Select from AI Chat, Image Generation, Video Creation, Code Building, and 18+ professional tools.",
    color: "from-amber-500/20 to-amber-500/5",
    borderColor: "border-amber-500/30",
    numberColor: "text-amber-400",
  },
  {
    number: "03",
    title: "Pick Your Model",
    description: "Access 80+ AI models including Megsy's flagship models, each optimized for specific creative tasks.",
    color: "from-rose-500/20 to-rose-500/5",
    borderColor: "border-rose-500/30",
    numberColor: "text-rose-400",
  },
  {
    number: "04",
    title: "Create & Iterate",
    description: "Generate, edit, and refine your content. Use advanced tools to upscale, restyle, and perfect results.",
    color: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
    numberColor: "text-purple-400",
  },
  {
    number: "05",
    title: "Export & Deploy",
    description: "Download your creations in any format, deploy code projects live, or share directly to social platforms.",
    color: "from-cyan-500/20 to-cyan-500/5",
    borderColor: "border-cyan-500/30",
    numberColor: "text-cyan-400",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          {/* Left: title */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/3 lg:sticky lg:top-32 lg:self-start"
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none mb-6">
              HOW IT{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                WORKS
              </span>
            </h2>
            <p className="text-white/40 text-lg">
              From signup to deployment in five simple steps. No complex setup required.
            </p>
          </motion.div>

          {/* Right: stacked cards */}
          <div className="lg:w-2/3 space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 80, rotateY: -10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
              >
                <div
                  className={`relative rounded-2xl border ${step.borderColor} bg-gradient-to-r ${step.color} p-8 md:p-10 hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="flex items-start gap-6">
                    <span
                      className={`text-5xl md:text-6xl font-black ${step.numberColor} opacity-60 leading-none`}
                    >
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-white font-bold text-xl md:text-2xl mb-2">
                        {step.title}
                      </h3>
                      <p className="text-white/50 text-sm md:text-base leading-relaxed">
                        {step.description}
                      </p>
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
