import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { API_MODELS, API_CATEGORIES } from "@/lib/apiModelsData";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display text-lg font-bold text-foreground">Models</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/api/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Docs</Link>
            <Link to="/settings/apis" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get API Key
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Model Catalog</h1>
          <p className="text-muted-foreground text-sm">Browse all {API_MODELS.length}+ AI models available through the unified API</p>
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
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Models Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border bg-secondary/30 text-xs font-medium text-muted-foreground">
            <span className="col-span-3">Model</span>
            <span className="col-span-5 hidden sm:block">Description</span>
            <span className="col-span-2 text-center hidden sm:block">Category</span>
            <span className="col-span-2 sm:col-span-2 text-right">Credits</span>
          </div>
          {filtered.map((model, i) => {
            const catLabel = API_CATEGORIES.find(c => c.id === model.category)?.label || model.category;
            return (
              <div key={model.id} className={`grid grid-cols-12 px-4 py-3 text-sm items-center ${i > 0 ? "border-t border-border" : ""} hover:bg-secondary/20 transition-colors`}>
                <div className="col-span-5 sm:col-span-3">
                  <span className="font-medium text-foreground">{model.name}</span>
                  <code className="block text-[10px] text-muted-foreground mt-0.5">{model.id}</code>
                </div>
                <span className="col-span-5 text-muted-foreground text-xs hidden sm:block line-clamp-1">{model.description}</span>
                <span className="col-span-2 text-center hidden sm:block">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{catLabel}</span>
                </span>
                <span className="col-span-7 sm:col-span-2 text-right text-primary font-medium">{model.credits} cr</span>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No models found matching "{search}"</p>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="mt-12 rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
            <span className="text-xs font-medium text-muted-foreground">Pricing Summary</span>
          </div>
          {API_CATEGORIES.map((cat, i) => {
            const models = API_MODELS.filter(m => m.category === cat.id);
            const min = Math.min(...models.map(m => m.credits));
            const max = Math.max(...models.map(m => m.credits));
            return (
              <div key={cat.id} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">({models.length})</span>
                </div>
                <span className="text-primary font-medium">
                  {min === max ? `${min} credits` : `${min}-${max} credits`}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-card border border-border p-8 text-center">
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
