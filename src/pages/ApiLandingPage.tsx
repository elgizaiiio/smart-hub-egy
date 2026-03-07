import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Check, Play } from "lucide-react";
import { API_MODELS } from "@/lib/apiModelsData";

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
  { title: "Chat", param: "?type=chat", desc: "Conversational AI" },
  { title: "Images", param: "?type=images", desc: "Text to image" },
  { title: "Video", param: "?type=video", desc: "AI video generation" },
  { title: "Code", param: "?type=code", desc: "Code completion" },
  { title: "Files", param: "?type=files", desc: "Document processing" },
  { title: "Chatbot", param: "?type=chatbot", desc: "AI chatbot platform" },
  { title: "Search", param: "?type=search", desc: "Google Search API" },
  { title: "Scrape", param: "?type=scrape", desc: "Web scraping & crawling" },
  { title: "Screenshot", param: "?type=screenshot", desc: "Website screenshots" },
  { title: "Enrich", param: "?type=enrich", desc: "Company & IP data" },
];

const PRICING_TABLE = [
  { api: "Chat Input", price: "$0.52 / 1M tokens" },
  { api: "Chat Output", price: "$4.30 / 1M tokens" },
  { api: "Images", price: "$0.26 / image" },
  { api: "Video (10s)", price: "$0.85" },
  { api: "Video (30s)", price: "$2.60" },
  { api: "Code Input", price: "$5.20 / 1M tokens" },
  { api: "Code Output", price: "$26.00 / 1M tokens" },
  { api: "Files", price: "$0.06 / page" },
];

const CODE_EXAMPLE = `const response = await fetch('https://api.megsyai.com/v1/router?type=chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

const ApiLandingPage = () => {
  const [copied, setCopied] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold text-foreground">Megsy</Link>
          <div className="flex items-center gap-4">
            <Link to="/api/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            <Link to="/api/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Models</Link>
            <Link to="/settings/apis" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get API Key
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Build with <span className="text-primary">Megsy AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            One API for chat, images, video, and code generation — Simple pricing — Instant setup
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/settings/apis" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/api/docs" className="px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
              Documentation
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Unified Endpoint */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">One API. Endless possibilities.</h2>
          <p className="text-muted-foreground">All capabilities through a single unified endpoint — just change the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-sm">type</code> parameter.</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-center group cursor-default"
            >
              <h3 className="font-display text-sm font-bold text-primary mb-0.5">{svc.title}</h3>
              <code className="text-[10px] text-muted-foreground">{svc.param}</code>
              <p className="text-xs text-muted-foreground mt-1.5">{svc.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Code Example */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Simple integration</h2>
          <p className="text-muted-foreground text-sm">Get started with just a few lines of code</p>
        </motion.div>

        <div className="rounded-xl border border-border bg-card overflow-hidden max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">javascript</span>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(CODE_EXAMPLE); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-5 overflow-x-auto text-sm">
            <code className="text-muted-foreground">{CODE_EXAMPLE}</code>
          </pre>
        </div>
      </section>

      {/* Showcase */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Built with Megsy API</h2>
          <p className="text-muted-foreground text-sm">Real outputs generated by our models</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {SHOWCASE_IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="aspect-square rounded-xl overflow-hidden border border-border"
            >
              <img src={img} alt={`AI generated ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SHOWCASE_VIDEOS.map((vid, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="aspect-video rounded-xl overflow-hidden border border-border relative group cursor-pointer"
              onClick={() => setPlayingVideo(playingVideo === i ? null : i)}
            >
              <video
                src={vid}
                className="w-full h-full object-cover"
                muted loop playsInline
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Pricing</h2>
          <p className="text-muted-foreground text-sm">Simple, transparent pricing per request</p>
        </motion.div>

        <div className="max-w-lg mx-auto rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-2 px-4 py-2.5 border-b border-border bg-secondary/30 text-xs font-medium text-muted-foreground">
            <span>API</span>
            <span className="text-right">Price</span>
          </div>
          {PRICING_TABLE.map((row, i) => (
            <div key={row.api} className={`grid grid-cols-2 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
              <span className="text-foreground font-medium">{row.api}</span>
              <span className="text-primary font-medium text-right">{row.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "Lightning Fast", desc: "Sub-second response times" },
            { title: "Secure", desc: "Enterprise-grade security" },
            { title: "Global", desc: "99.9% uptime worldwide" },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-xl border border-border bg-card text-center">
              <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Ready to build?</h2>
          <p className="text-muted-foreground mb-6">Create your account and get your API key in seconds.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/settings/apis" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
            <Link to="/pricing" className="px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Megsy AI</span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/api/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link to="/api/models" className="hover:text-foreground transition-colors">Models</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ApiLandingPage;
