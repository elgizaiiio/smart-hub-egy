import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, MessageSquare, Image, Wand2, Video, Film, User, Globe, Brain, Cpu, Zap, Sparkles, Palette, Layers, Type, Leaf, PenTool, Star, Flower2, Brush, Moon, Wind, Waves, Shapes, Camera, Hexagon, Smile, QrCode, Edit3, Eraser, Droplets, Maximize2, Sliders, Copy, Scissors, ArrowUpRight, Scan, Clock, Replace, Paintbrush, Sun, Package, UserCircle, Clapperboard, Gauge, Play, Tv, Music, MonitorPlay, Columns, Mic, AudioLines, Terminal } from "lucide-react";
import { API_MODELS, API_CATEGORIES, type ApiModel } from "@/lib/apiModelsData";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, Brain, Cpu, Zap, Search, Sparkles, Image, Palette, Layers, Type, Leaf, PenTool, Star, Flower2, Brush, Moon, Wind, Waves, Shapes, Camera, Hexagon, Smile, QrCode, Edit3, Eraser, Droplets, Maximize2, Sliders, Copy, Scissors, ArrowUpRight, Scan, Clock, Replace, Paintbrush, Sun, Package, UserCircle, Video, Clapperboard, Gauge, Film, Play, Tv, Music, MonitorPlay, Columns, User, Mic, AudioLines, Globe, Terminal, Wand2,
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "chat": MessageSquare,
  "image-gen": Image,
  "image-tools": Wand2,
  "video-gen": Video,
  "video-i2v": Film,
  "avatar": User,
  "services": Globe,
};

const ApiModelsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    let models = API_MODELS;
    if (activeCategory !== "all") models = models.filter(m => m.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      models = models.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
    }
    return models;
  }, [search, activeCategory]);

  const getIcon = (iconName: string) => ICON_MAP[iconName] || Sparkles;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display text-lg font-bold text-foreground">Models & Services</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/api/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Docs</Link>
            <Link to="/settings/apis" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get API Key
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Model Catalog</h1>
          <p className="text-muted-foreground">Browse all {API_MODELS.length}+ AI models available through the Megsy API</p>
        </motion.div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            All ({API_MODELS.length})
          </button>
          {API_CATEGORIES.map(cat => {
            const count = API_MODELS.filter(m => m.category === cat.id).length;
            const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-3 h-3" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Models Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((model, i) => {
            const Icon = getIcon(model.icon);
            const catLabel = API_CATEGORIES.find(c => c.id === model.category)?.label || model.category;
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground truncate">{model.name}</h3>
                    <span className="text-[10px] text-muted-foreground">{catLabel}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{model.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">{model.credits} credit{model.credits !== 1 ? "s" : ""}/request</span>
                  <code className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{model.id}</code>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No models found matching "{search}"</p>
          </div>
        )}

        {/* Summary Table */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16">
          <h2 className="font-display text-xl font-bold text-foreground mb-4 text-center">Pricing Summary</h2>
          <div className="max-w-2xl mx-auto rounded-xl border border-border overflow-hidden">
            {API_CATEGORIES.map((cat, i) => {
              const models = API_MODELS.filter(m => m.category === cat.id);
              const minCredits = Math.min(...models.map(m => m.credits));
              const maxCredits = Math.max(...models.map(m => m.credits));
              const CatIcon = CATEGORY_ICONS[cat.id] || Sparkles;
              return (
                <div key={cat.id} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">({models.length} models)</span>
                  </div>
                  <span className="text-primary font-medium text-sm">
                    {minCredits === maxCredits ? `${minCredits} credits` : `${minCredits}–${maxCredits} credits`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-8 text-center">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Start Using These Models</h2>
          <p className="text-sm text-muted-foreground mb-4">Get your API key and integrate any model in minutes.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/settings/apis" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Get API Key</Link>
            <Link to="/api/docs" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Read Docs</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiModelsPage;
