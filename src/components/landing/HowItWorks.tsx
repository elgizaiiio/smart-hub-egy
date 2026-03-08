import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds and get free credits to explore all AI models instantly.",
    blobColor: "#10b981",
  },
  {
    number: "02",
    title: "Choose Your Tool",
    description: "Pick from Chat, Images, Video, Code, and 18+ professional creative tools.",
    blobColor: "#f59e0b",
  },
  {
    number: "03",
    title: "Pick Your Model",
    description: "Access 80+ AI models, each fine-tuned for specific creative tasks.",
    blobColor: "#ef4444",
  },
  {
    number: "04",
    title: "Create & Iterate",
    description: "Generate, edit, upscale, restyle — refine until it's perfect.",
    blobColor: "#8b5cf6",
  },
  {
    number: "05",
    title: "Export & Deploy",
    description: "Download any format, deploy live, or share to social platforms.",
    blobColor: "#06b6d4",
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
          <h2 className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[8vw]">
            GET STARTED
          </h2>
          <h2 className="font-display text-[12vw] font-black uppercase leading-[0.85] tracking-tighter md:text-[8vw]">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              WITH MEGSY
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl text-white/40">
            From signup to deployment in five simple steps.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 80, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <div className={`h-full rounded-3xl border bg-gradient-to-b p-7 transition-transform duration-300 hover:scale-[1.03] ${step.color}`}>
                <span className={`text-5xl font-black leading-none ${step.numColor} opacity-60`}>
                  {step.number}
                </span>
                <h3 className="mt-4 mb-3 text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/45">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
