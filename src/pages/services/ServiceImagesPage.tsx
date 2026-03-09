import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import { Image, Sparkles, Zap, Wand2, ArrowRight } from "lucide-react";

const features = [
  { icon: Sparkles, title: "Text to Image", desc: "Describe your vision and watch Megsy Pro bring it to life with photorealistic quality." },
  { icon: Wand2, title: "Image Editing", desc: "Refine, enhance, and transform your images with intelligent AI-powered editing tools." },
  { icon: Zap, title: "Instant Generation", desc: "Get results in seconds, not minutes. Megsy Pro is optimized for speed without sacrificing quality." },
  { icon: Image, title: "Style Control", desc: "Choose from dozens of artistic styles or create your own unique visual identity." },
];

const ServiceImagesPage = () => {
  const navigate = useNavigate();

  return (
    <div data-theme="dark" className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 mx-auto max-w-6xl text-center"
        >
          <h1 className="font-display mt-4 text-6xl font-black uppercase leading-tight tracking-tight md:text-8xl lg:text-9xl">
            AI Image<br />
            <span className="text-primary">Generator</span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground md:text-2xl">
            Create stunning, photorealistic images from text prompts using our proprietary Megsy Pro model.
            From concept art to product photography — generate anything you imagine.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <FancyButton onClick={() => navigate("/auth")} className="text-lg px-10 py-4">
              Start Creating Free <ArrowRight className="ml-2 h-5 w-5" />
            </FancyButton>
            <button
              onClick={() => navigate("/#pricing")}
              className="rounded-full border border-border px-8 py-4 text-base font-medium text-foreground transition-all hover:border-foreground/40"
            >
              View Pricing
            </button>
          </div>
        </motion.div>
      </section>

      {/* Megsy Pro Promo */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-12 md:p-20"
        >
          <div className="flex flex-col items-center gap-12 md:flex-row">
            <div className="flex-1">
              <h2 className="font-display text-4xl font-black uppercase md:text-5xl">
                Why <span className="text-primary">Megsy Pro</span>?
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Our flagship model delivers unmatched image quality with faster generation times.
                Trained on diverse, high-quality datasets, Megsy Pro understands context, composition,
                and artistic style better than any competitor.
              </p>
              <ul className="mt-8 space-y-4">
                {["4x faster than DALL-E 3", "Photorealistic quality at any resolution", "Built-in style consistency", "No content restrictions on art"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base text-foreground/80">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] md:w-96">
              <Sparkles className="h-20 w-20 text-primary/40" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="font-display text-center text-4xl font-black uppercase md:text-5xl">
          Everything You Need
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 transition-colors hover:border-primary/20 hover:bg-primary/[0.03]"
            >
              <f.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
              <p className="mt-3 text-base text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-28 text-center">
        <h2 className="font-display text-4xl font-black uppercase md:text-6xl">
          Ready to Create?
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">Join thousands of creators using Megsy Pro to bring their ideas to life.</p>
        <FancyButton onClick={() => navigate("/auth")} className="mt-10 text-lg px-12 py-4">
          Get Started Free
        </FancyButton>
      </section>

      <LandingFooter />
    </div>
  );
};

export default ServiceImagesPage;
