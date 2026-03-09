import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import { Image, Sparkles, Zap, Wand2, Star } from "lucide-react";

const features = [
  { icon: Sparkles, title: "Text to Image", desc: "Describe your vision and watch Megsy Pro bring it to life with photorealistic quality." },
  { icon: Wand2, title: "Image Editing", desc: "Refine, enhance, and transform your images with intelligent AI-powered editing tools." },
  { icon: Zap, title: "Instant Generation", desc: "Get results in seconds, not minutes. Megsy Pro is optimized for speed without sacrificing quality." },
  { icon: Image, title: "Style Control", desc: "Choose from dozens of artistic styles or create your own unique visual identity." },
];

// LEFT side images - stacked/overlapping cluster
const leftImages = [
  { src: "/showcase/img-1.jpg", top: "8%", left: "-3%", width: 180, height: 260, speed: 0.02, rotate: -8, zIndex: 3 },
  { src: "/showcase/img-2.jpg", top: "32%", left: "6%", width: 200, height: 300, speed: 0.03, rotate: 5, zIndex: 2 },
  { src: "/showcase/img-3.jpg", top: "65%", left: "-1%", width: 190, height: 150, speed: 0.025, rotate: -3, zIndex: 1 },
];

// RIGHT side images - stacked/overlapping cluster  
const rightImages = [
  { src: "/showcase/img-4.jpg", top: "5%", right: "-5%", width: 200, height: 300, speed: 0.025, rotate: 6, zIndex: 3 },
  { src: "/showcase/img-5.jpg", top: "38%", right: "8%", width: 170, height: 120, speed: 0.035, rotate: -4, zIndex: 2 },
  { src: "/showcase/img-6.jpg", top: "52%", right: "-2%", width: 150, height: 200, speed: 0.03, rotate: 3, zIndex: 1 },
  { src: "/showcase/model-1.jpg", top: "72%", right: "5%", width: 140, height: 180, speed: 0.02, rotate: -5, zIndex: 4 },
];

const ServiceImagesPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div data-theme="dark" className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

      {/* Hero with Parallax Images */}
      <section 
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 pt-20"
      >
        {/* LEFT side floating images */}
        {leftImages.map((img, i) => (
          <motion.div
            key={`left-${i}`}
            className="absolute overflow-hidden rounded-xl shadow-2xl pointer-events-none hidden lg:block"
            style={{
              top: img.top,
              left: img.left,
              width: img.width,
              height: img.height,
              zIndex: img.zIndex,
            }}
            initial={{ opacity: 0, scale: 0.8, x: -100 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: mousePosition.x * 50 * img.speed,
              y: mousePosition.y * 40 * img.speed,
              rotate: img.rotate + mousePosition.x * 2,
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: i * 0.15 },
              scale: { duration: 0.8, delay: i * 0.15 },
              x: { duration: 0.15, ease: "easeOut" },
              y: { duration: 0.15, ease: "easeOut" },
              rotate: { duration: 0.2, ease: "easeOut" },
            }}
          >
            <img src={img.src} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}

        {/* RIGHT side floating images */}
        {rightImages.map((img, i) => (
          <motion.div
            key={`right-${i}`}
            className="absolute overflow-hidden rounded-xl shadow-2xl pointer-events-none hidden lg:block"
            style={{
              top: img.top,
              right: img.right,
              width: img.width,
              height: img.height,
              zIndex: img.zIndex,
            }}
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: mousePosition.x * -50 * img.speed,
              y: mousePosition.y * 40 * img.speed,
              rotate: img.rotate - mousePosition.x * 2,
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: i * 0.15 },
              scale: { duration: 0.8, delay: i * 0.15 },
              x: { duration: 0.15, ease: "easeOut" },
              y: { duration: 0.15, ease: "easeOut" },
              rotate: { duration: 0.2, ease: "easeOut" },
            }}
          >
            <img src={img.src} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}

        {/* Center Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative z-10 mx-auto max-w-4xl text-center px-4"
        >
          <h1 className="font-display text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-white">THE AI IMAGE </span>
            <span className="text-primary">GENERATOR</span>
            <br />
            <span className="text-primary">FOR AMBITIOUS CREATIVES</span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-base text-white/60 sm:text-lg md:text-xl leading-relaxed">
            Turn text into images, transform images into new styles, or refine visuals with pro-level precision.
            Megsy's AI image generator gives you speed, consistency, and control,
            whether you're prototyping products, scaling content, or creating for yourself.
          </p>

          {/* Star Rating */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-lg font-bold text-white">4.9</span>
            <span className="text-sm text-white/50">based on 12.5K Ratings</span>
          </div>

          {/* CTA Button */}
          <div className="mt-10">
            <button
              onClick={() => navigate("/auth")}
              className="rounded-full bg-white px-10 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 hover:scale-105"
            >
              Generate AI Image
            </button>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
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
