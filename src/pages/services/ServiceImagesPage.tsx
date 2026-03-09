import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import { Image, Sparkles, Zap, Wand2 } from "lucide-react";

const features = [
  { icon: Sparkles, title: "Text to Image", desc: "Describe your vision and watch Megsy Pro bring it to life with photorealistic quality." },
  { icon: Wand2, title: "Image Editing", desc: "Refine, enhance, and transform your images with intelligent AI-powered editing tools." },
  { icon: Zap, title: "Instant Generation", desc: "Get results in seconds, not minutes. Megsy Pro is optimized for speed without sacrificing quality." },
  { icon: Image, title: "Style Control", desc: "Choose from dozens of artistic styles or create your own unique visual identity." },
];

// LEFT side images
const leftImages = [
  { src: "/showcase/model-3.jpg", top: "20%", left: "3%", width: 200, height: 260, speedX: 15, speedY: 10, zIndex: 1 },
  { src: "/showcase/img-3.jpg", top: "38%", left: "6%", width: 260, height: 340, speedX: 25, speedY: 18, zIndex: 2 },
  { src: "/showcase/model-5.jpg", top: "60%", left: "12%", width: 220, height: 280, speedX: 35, speedY: 22, zIndex: 3 },
];

// RIGHT side images
const rightImages = [
  { src: "/showcase/img-6.jpg", top: "20%", right: "4%", width: 220, height: 290, speedX: 20, speedY: 12, zIndex: 1 },
  { src: "/showcase/model-4.jpg", top: "42%", right: "8%", width: 280, height: 200, speedX: 30, speedY: 20, zIndex: 2 },
  { src: "/showcase/model-6.jpg", top: "58%", right: "3%", width: 240, height: 320, speedX: 18, speedY: 25, zIndex: 3 },
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
        {/* LEFT side floating images - each moves independently */}
        {leftImages.map((img, i) => (
          <motion.div
            key={`left-${i}`}
            className="absolute overflow-hidden rounded-lg pointer-events-none hidden lg:block"
            style={{
              top: img.top,
              left: img.left,
              width: img.width,
              height: img.height,
              zIndex: img.zIndex,
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ 
              opacity: 1, 
              x: mousePosition.x * img.speedX,
              y: mousePosition.y * img.speedY,
            }}
            transition={{ 
              opacity: { duration: 1, delay: i * 0.2 },
              x: { duration: 0.2 + i * 0.1, ease: "easeOut" },
              y: { duration: 0.2 + i * 0.1, ease: "easeOut" },
            }}
          >
            <img src={img.src} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}

        {/* RIGHT side floating images - each moves independently */}
        {rightImages.map((img, i) => (
          <motion.div
            key={`right-${i}`}
            className="absolute overflow-hidden rounded-lg pointer-events-none hidden lg:block"
            style={{
              top: img.top,
              right: img.right,
              width: img.width,
              height: img.height,
              zIndex: img.zIndex,
            }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ 
              opacity: 1, 
              x: mousePosition.x * -img.speedX,
              y: mousePosition.y * img.speedY,
            }}
            transition={{ 
              opacity: { duration: 1, delay: i * 0.2 },
              x: { duration: 0.25 + i * 0.08, ease: "easeOut" },
              y: { duration: 0.25 + i * 0.08, ease: "easeOut" },
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

      {/* Why Creatives Choose Megsy */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl lg:text-6xl">
            WHY CREATIVES CHOOSE
            <br />
            <span className="text-primary">MEGSY'S AI IMAGE GENERATOR</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Most AI tools promise fast results. But speed without quality creates more problems
            than it solves. Megsy is built for creatives who care about both craft and efficiency.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[280px]">
          {/* Card 1 - Green accent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl bg-primary p-6 flex flex-col justify-between lg:row-span-2"
          >
            <div className="w-16 h-16 flex items-center justify-center">
              <Zap className="w-12 h-12 text-black" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black">From idea to execution, effortlessly.</h3>
              <p className="mt-3 text-sm text-black/70">
                Megsy puts creative control in your hands, so you can refine and finish your work in one place, without jumping between tools.
              </p>
            </div>
          </motion.div>

          {/* Card 2 - Image with overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden lg:col-span-2 lg:row-span-1"
          >
            <img src="/showcase/img-3.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-xl font-bold text-white">Diverse styles, professional polish.</h3>
              <p className="mt-2 text-sm text-white/70 max-w-sm">
                Go from photorealism to bold artistic aesthetics. Prototype, pitch, or publish without encountering creative roadblocks.
              </p>
            </div>
          </motion.div>

          {/* Card 3 - Yellow accent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl bg-yellow-400 p-6 flex flex-col justify-between lg:row-span-2"
          >
            <div className="w-16 h-16 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-black" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black">Consistency and control.</h3>
              <p className="mt-3 text-sm text-black/70">
                Keep characters, styles, and brand elements streamlined across every output; perfect for designers, marketers, and creators who need to stay on brand.
              </p>
            </div>
          </motion.div>

          {/* Card 4 - Image with overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative rounded-2xl overflow-hidden lg:col-span-2 lg:row-span-1"
          >
            <img src="/showcase/model-4.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-xl font-bold text-white">Built for real creatives.</h3>
              <p className="mt-2 text-sm text-white/70 max-w-sm">
                With advanced tools like AI Canvas, Image-to-Image, and Style Transfer, you can go beyond ordinary and deliver visuals with purpose.
              </p>
            </div>
          </motion.div>
        </div>
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
