import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds. Get free credits to start exploring all 80+ AI models immediately.",
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    numColor: "text-emerald-400",
  },
  {
    number: "02",
    title: "Choose Your Tool",
    description: "Select from AI Chat, Image Generation, Video Creation, Code Building, and 18+ professional image tools.",
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    numColor: "text-amber-400",
  },
  {
    number: "03",
    title: "Pick Your Model",
    description: "Access 80+ AI models including Megsy's flagship models, each optimized for specific creative tasks.",
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
    numColor: "text-rose-400",
  },
  {
    number: "04",
    title: "Create & Iterate",
    description: "Generate, edit, and refine. Use advanced tools to upscale, restyle, and perfect your results.",
    color: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    numColor: "text-purple-400",
  },
  {
    number: "05",
    title: "Export & Deploy",
    description: "Download in any format, deploy code projects live, or share directly to social platforms.",
    color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
    numColor: "text-cyan-400",
  },
];

const services = [
  "Smart Chat", "Voice Talk", "Memory", "80+ Models", "Chat History", "Custom Prompts",
  "Create Images", "Edit Photos", "Remove BG", "4K Upscale", "Style Transfer", "Text → Image",
  "Create Videos", "Animate", "Image → Video", "Text → Video", "Edit Videos",
  "Analyze Files", "Summarize Docs", "Read PDFs", "Extract Data", "Spreadsheets", "OCR Scan",
  "Write Code", "Code Review", "1-Click Deploy", "Live Preview", "GitHub Sync", "Vercel Deploy",
  "Fix Bugs", "Full-Stack Apps", "Web Search", "Deep Research", "News Feed", "Academic Papers",
  "AI Agents", "Auto Tasks", "Send Emails", "Telegram Bot", "Google Drive", "Notion Sync",
  "Composio", "Translate", "Schedule", "API Access", "Webhooks", "Workflows",
];

const HowItWorks = () => {
  const navigate = useNavigate();
  const items = [...services, ...services];

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

      {/* Services Marquee */}
      <div className="mt-20">
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
            <div className="landing-marquee-track flex gap-3">
              {items.map((s, i) => (
                <FancyButton key={i} onClick={() => navigate("/auth")} className="text-xs whitespace-nowrap">
                  {s}
                </FancyButton>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 reverse */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
          <div className="landing-marquee">
            <div className="landing-marquee-track-reverse flex gap-3">
              {[...items].reverse().map((s, i) => (
                <FancyButton key={i} onClick={() => navigate("/auth")} className="text-xs whitespace-nowrap">
                  {s}
                </FancyButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
