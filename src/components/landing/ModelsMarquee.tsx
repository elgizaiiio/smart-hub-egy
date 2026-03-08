import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

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

const providers = ["Google", "Amazon", "Supabase", "GitHub"];

const ModelsMarquee = () => {
  const navigate = useNavigate();
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
    </section>
  );
};

export default ModelsMarquee;
