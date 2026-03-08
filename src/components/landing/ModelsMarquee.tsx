import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const services = [
  { label: "Smart Chat", color: "from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-300" },
  { label: "Voice Talk", color: "from-sky-500/20 to-cyan-500/20 border-sky-500/30 text-sky-300" },
  { label: "Memory", color: "from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300" },
  { label: "80+ Models", color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-300" },
  { label: "Chat History", color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300" },
  { label: "Custom Prompts", color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-300" },
  { label: "Create Images", color: "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-300" },
  { label: "Edit Photos", color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-300" },
  { label: "Remove BG", color: "from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-300" },
  { label: "4K Upscale", color: "from-lime-500/20 to-green-500/20 border-lime-500/30 text-lime-300" },
  { label: "Style Transfer", color: "from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-300" },
  { label: "Text → Image", color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300" },
  { label: "Create Videos", color: "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300" },
  { label: "Animate", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-300" },
  { label: "Image → Video", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300" },
  { label: "Text → Video", color: "from-pink-500/20 to-fuchsia-500/20 border-pink-500/30 text-pink-300" },
  { label: "Edit Videos", color: "from-green-500/20 to-teal-500/20 border-green-500/30 text-green-300" },
  { label: "Analyze Files", color: "from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-300" },
  { label: "Summarize Docs", color: "from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-300" },
  { label: "Read PDFs", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300" },
  { label: "Extract Data", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300" },
  { label: "Spreadsheets", color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300" },
  { label: "OCR Scan", color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300" },
  { label: "Write Code", color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-300" },
  { label: "Code Review", color: "from-fuchsia-500/20 to-violet-500/20 border-fuchsia-500/30 text-fuchsia-300" },
  { label: "1-Click Deploy", color: "from-teal-500/20 to-green-500/20 border-teal-500/30 text-teal-300" },
  { label: "Live Preview", color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300" },
  { label: "GitHub Sync", color: "from-lime-500/20 to-emerald-500/20 border-lime-500/30 text-lime-300" },
  { label: "Vercel Deploy", color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-300" },
  { label: "Fix Bugs", color: "from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300" },
  { label: "Full-Stack Apps", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300" },
  { label: "Web Search", color: "from-yellow-500/20 to-lime-500/20 border-yellow-500/30 text-yellow-300" },
  { label: "Deep Research", color: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300" },
  { label: "News Feed", color: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300" },
  { label: "Academic Papers", color: "from-violet-500/20 to-blue-500/20 border-violet-500/30 text-violet-300" },
  { label: "AI Agents", color: "from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-300" },
  { label: "Auto Tasks", color: "from-emerald-500/20 to-lime-500/20 border-emerald-500/30 text-emerald-300" },
  { label: "Send Emails", color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-300" },
  { label: "Telegram Bot", color: "from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-300" },
  { label: "Google Drive", color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300" },
  { label: "Notion Sync", color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-300" },
  { label: "Composio", color: "from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30 text-fuchsia-300" },
  { label: "Translate", color: "from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-300" },
  { label: "Schedule", color: "from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-300" },
  { label: "API Access", color: "from-lime-500/20 to-yellow-500/20 border-lime-500/30 text-lime-300" },
  { label: "Webhooks", color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-300" },
  { label: "Workflows", color: "from-blue-500/20 to-sky-500/20 border-blue-500/30 text-blue-300" },
];

const providers = ["Google", "Amazon", "Supabase", "GitHub"];

const ServiceChip = ({ label, color }: { label: string; color: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/auth")}
      className={`group relative inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-gradient-to-r px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg ${color}`}
    >
      <span className="relative z-10">{label}</span>
      <span className="relative z-10 flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest opacity-0 transition-all duration-300 group-hover:opacity-100">
        🔓 PRO
      </span>
    </button>
  );
};

const ModelsMarquee = () => {
  const items = [...services, ...services];

  return (
    <section id="models" className="relative overflow-hidden py-20">
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

      <div className="mx-auto mb-16 flex max-w-5xl items-center justify-center gap-10 px-6 md:gap-20">
        {providers.map((name) => (
          <span key={name} className="text-lg font-black uppercase tracking-wider text-foreground/20 md:text-2xl">
            {name}
          </span>
        ))}
      </div>

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
              <ServiceChip key={i} label={s.label} color={s.color} />
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
              <ServiceChip key={i} label={s.label} color={s.color} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelsMarquee;
