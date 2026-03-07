import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Image, Video, Code, Globe, MessageSquare, Shield, CreditCard, ChevronRight, Play } from "lucide-react";
import { API_MODELS, API_CATEGORIES } from "@/lib/apiModelsData";

const SHOWCASE_IMAGES = [
  "/api-showcase/showcase-1.png",
  "/api-showcase/showcase-2.jpg",
  "/api-showcase/showcase-3.jpg",
  "/api-showcase/showcase-4.jpg",
];

const SHOWCASE_VIDEOS = [
  "/api-showcase/video-1.mp4",
  "/api-showcase/video-2.mp4",
  "/api-showcase/video-3.mp4",
  "/api-showcase/video-4.mp4",
  "/api-showcase/video-5.mp4",
  "/api-showcase/video-6.mp4",
];

const SERVICES = [
  { icon: MessageSquare, title: "Chat Completions", desc: "Access 5+ frontier chat models through a unified API. Multi-turn conversations, system prompts, streaming support.", endpoint: "/v1/chat/completions", color: "from-blue-500 to-cyan-500" },
  { icon: Image, title: "Image Generation", desc: "19+ generation models and 18+ editing tools. Text-to-image, inpainting, upscaling, style transfer, and more.", endpoint: "/v1/images/generate", color: "from-pink-500 to-rose-500" },
  { icon: Video, title: "Video Generation", desc: "11+ T2V models, 8+ I2V models, 4+ avatar models. Cinematic quality from text or images.", endpoint: "/v1/videos/generate", color: "from-violet-500 to-purple-500" },
  { icon: Globe, title: "Web Search", desc: "Real-time web search with AI-powered summarization. Get structured, relevant results instantly.", endpoint: "/v1/search", color: "from-emerald-500 to-teal-500" },
  { icon: Code, title: "Code Execution", desc: "Run code in sandboxed environments. Full package support, real-time output, live preview URLs.", endpoint: "/v1/code/execute", color: "from-orange-500 to-amber-500" },
];

const STATS = [
  { value: `${API_MODELS.length}+`, label: "AI Models" },
  { value: `${API_CATEGORIES.length}`, label: "Categories" },
  { value: "<2s", label: "Avg Response" },
  { value: "99.9%", label: "Uptime" },
];

const PRICING_TIERS = [
  { name: "Chat Models", range: "1 credit/request", desc: "All conversational AI models" },
  { name: "Image Generation", range: "1-5 credits", desc: "Text-to-image models" },
  { name: "Image Tools", range: "1-3 credits", desc: "Edit, upscale, remove, enhance" },
  { name: "Video Generation", range: "5-30 credits", desc: "Text-to-video & image-to-video" },
  { name: "Avatar & Lipsync", range: "2-50 credits", desc: "Talking heads & lip-sync" },
  { name: "Services", range: "2-5 credits", desc: "Search & code execution" },
];

const ApiLandingPage = () => {
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="Megsy" className="h-7 w-7" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="font-display text-xl font-bold text-foreground">Megsy<span className="text-primary">API</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/api/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Docs</Link>
            <Link to="/api/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Models</Link>
            <Link to="/settings/apis" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-xs text-muted-foreground mb-6">
              <Zap className="w-3 h-3 text-primary" /> Powering the next generation of AI apps
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              One API for<br />
              <span className="text-primary">All AI Models</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Access {API_MODELS.length}+ AI models for chat, image generation, video creation, and more through a single, unified API. Pay only for what you use.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/api/docs" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                Read the Docs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/settings/apis" className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
                Get API Key
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {STATS.map((s, i) => (
              <div key={i} className="text-center p-4 rounded-xl border border-border bg-card">
                <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">Quick Start</span>
          </div>
          <pre className="p-6 overflow-x-auto text-sm">
            <code className="text-muted-foreground">
{`curl https://api.megsyai.com/v1/chat/completions \\
  -H "Authorization: Bearer mk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "megsy-v1",
    "messages": [
      {"role": "user", "content": "Hello, Megsy!"}
    ]
  }'`}
            </code>
          </pre>
        </motion.div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Everything You Need</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Five powerful endpoints covering the full spectrum of AI capabilities</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center mb-4`}>
                <svc.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{svc.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{svc.desc}</p>
              <code className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">{svc.endpoint}</code>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Built with Megsy API</h2>
          <p className="text-muted-foreground">Real outputs generated by our models</p>
        </motion.div>

        {/* Images */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {SHOWCASE_IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="aspect-square rounded-xl overflow-hidden border border-border"
            >
              <img src={img} alt={`AI generated showcase ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Videos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SHOWCASE_VIDEOS.map((vid, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="aspect-video rounded-xl overflow-hidden border border-border relative group cursor-pointer"
              onClick={() => setPlayingVideo(playingVideo === i ? null : i)}
            >
              <video
                src={vid}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                autoPlay={playingVideo === i}
                ref={(el) => {
                  if (el) {
                    if (playingVideo === i) el.play().catch(() => {});
                    else { el.pause(); el.currentTime = 0; }
                  }
                }}
              />
              {playingVideo !== i && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <Play className="w-8 h-8 text-white/80" fill="white" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Simple, Usage-Based Pricing</h2>
          <p className="text-muted-foreground">Pay per request with credits. No monthly minimums, no hidden fees.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <h3 className="font-display font-semibold text-foreground mb-1">{tier.name}</h3>
              <div className="text-primary font-medium text-sm mb-2">{tier.range}</div>
              <p className="text-xs text-muted-foreground">{tier.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/api/models" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            View all model pricing <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Enterprise Security", desc: "All API keys are encrypted. Rate limiting, CORS support, and request logging included." },
            { icon: Zap, title: "Lightning Fast", desc: "Global edge network with <2s average response time for most models." },
            { icon: CreditCard, title: "Flexible Billing", desc: "Pay-as-you-go with credits. Buy credits in bulk for volume discounts." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-border bg-card text-center"
            >
              <f.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-8 sm:p-12 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">Start Building Today</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Get your API key and start integrating AI into your applications in minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/settings/apis" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Get Free API Key
            </Link>
            <Link to="/api/docs" className="px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2025 Megsy AI. All rights reserved.</span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/api/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link to="/api/models" className="hover:text-foreground transition-colors">Models</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ApiLandingPage;
