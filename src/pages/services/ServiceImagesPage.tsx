import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import { Image, Sparkles, Zap, Wand2 } from "lucide-react";

const howItWorksSteps = [
  { 
    number: "1", 
    title: "Prompt or Upload", 
    desc: "Type a text prompt or start from an existing image.",
    bg: "bg-primary",
    textColor: "text-primary-foreground"
  },
  { 
    number: "2", 
    title: "Pick a Style", 
    desc: "Choose Auto for the best model match, or pick your own for full control.",
    bg: "bg-yellow-400",
    textColor: "text-black"
  },
  { 
    number: "3", 
    title: "Refine & Adjust", 
    desc: "Use advanced editing tools to polish your results perfectly.",
    bg: "bg-rose-500",
    textColor: "text-white"
  },
  { 
    number: "4", 
    title: "Export & Share", 
    desc: "Download in any format or share directly to your platforms.",
    bg: "bg-purple-500",
    textColor: "text-white"
  },
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
            <img src="/showcase/img-5.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
            <div className="absolute bottom-0 left-0 p-6 z-10">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Endless creative possibilities.</h3>
              <p className="mt-2 text-sm text-white/90 max-w-sm drop-shadow-md">
                From hyperrealistic renders to abstract art. Create, iterate, and ship without creative limits.
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
              <h3 className="text-2xl font-bold text-black">Brand-ready outputs.</h3>
              <p className="mt-3 text-sm text-black/70">
                Maintain visual consistency across campaigns. Perfect for teams who need cohesive brand imagery at scale.
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
            <img src="/showcase/model-2.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
            <div className="absolute bottom-0 left-0 p-6 z-10">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Pro tools, zero complexity.</h3>
              <p className="mt-2 text-sm text-white/90 max-w-sm drop-shadow-md">
                AI Canvas, style transfer, and smart upscaling. Professional features made simple for every creator.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl lg:text-6xl">
            HOW MEGSY'S AI
            <br />
            <span className="text-primary">IMAGE GENERATOR WORKS</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Create with text or images, refine with pro features, and export visuals ready to share.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left - Steps */}
          <div className="flex flex-col gap-3">
            {howItWorksSteps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`${step.bg} rounded-2xl p-5 flex items-start gap-4 transition-transform hover:scale-[1.02]`}
              >
                <span className={`text-5xl font-black ${step.textColor} opacity-60`}>{step.number}</span>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${step.textColor}`}>{step.title}</h3>
                  <p className={`text-sm ${step.textColor} opacity-80 mt-1`}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right - Interface Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="rounded-2xl border border-white/10 bg-black/50 overflow-hidden backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Creation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">●</span> 999,996,047 credits
                </div>
              </div>
              
              {/* Content */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 p-3">
                {/* Left thumbnails */}
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 border border-white/10" />
                  ))}
                </div>
                
                {/* Main image area */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-black">
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 text-xs flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Ultra Upscale
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-40 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                  </div>
                </div>
                
                {/* Right panel */}
                <div className="w-44 space-y-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">P</div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Today</p>
                        <p className="text-xs font-medium">MegsyUser</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="text-white font-medium">Prompt</span> · Iterate
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      Same character playing piano against a red background
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
                      <Sparkles className="w-3 h-3" /> Nano Banana · 1344 x 768
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="space-y-1.5">
                    {["Remix", "Upscale", "Create Video", "Use as Guide"].map((action) => (
                      <button key={action} className="w-full text-xs py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center gap-2">
                        <Zap className="w-3 h-3 text-primary" /> {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
