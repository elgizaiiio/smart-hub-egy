import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds. Get free credits to start exploring all 80+ AI models immediately.",
    gradient: "from-emerald-500 to-cyan-400",
  },
  {
    number: "02",
    title: "Choose Your Tool",
    description: "Select from AI Chat, Image Generation, Video Creation, Code Building, and 18+ professional image tools.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    number: "03",
    title: "Pick Your Model",
    description: "Access 80+ AI models including Megsy's flagship models, each optimized for specific creative tasks.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    number: "04",
    title: "Create & Iterate",
    description: "Generate, edit, and refine. Use advanced tools to upscale, restyle, and perfect your results.",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    number: "05",
    title: "Export & Deploy",
    description: "Download in any format, deploy code projects live, or share directly to social platforms.",
    gradient: "from-cyan-400 to-blue-500",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-28 md:py-44">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-20 text-center"
        >
          <h2 className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[8vw]">
            GET STARTED
          </h2>
          <h2 className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter md:text-[8vw]">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              WITH MEGSY
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl text-muted-foreground">
            From signup to deployment in five simple steps.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 80, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="group"
            >
              {/* Glowing card container */}
              <div className="glow-card relative cursor-pointer transition-transform duration-500 hover:-translate-y-4">
                {/* Gradient border + glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-80 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-0 blur-[30px] transition-opacity duration-500 group-hover:opacity-60`} />

                {/* Inner dark background with glass edge */}
                <div className="absolute inset-[2px] rounded-[14px] bg-background/90 backdrop-blur-sm">
                  <div className="absolute inset-0 left-0 w-1/2 rounded-[14px] bg-foreground/[0.04]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col p-7">
                  <span className={`bg-gradient-to-br ${step.gradient} bg-clip-text text-5xl font-black leading-none text-transparent opacity-70`}>
                    {step.number}
                  </span>
                  <h3 className="mt-4 mb-3 text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
