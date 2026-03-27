import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, ArrowUp, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { IMAGE_TOOLS, NEW_IMAGE_MODELS } from "@/lib/imageToolsData";
import { useDynamicModels } from "@/hooks/useModels";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = 'home' | 'studio' | 'community';

const ImagesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>((location.state as any)?.tab || 'home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioImages, setStudioImages] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { models: dynamicModels } = useDynamicModels();

  useEffect(() => {
    if (activeTab === 'studio') loadStudioImages();
    if (activeTab === 'community') loadCommunity();
  }, [activeTab]);

  // Read tab from navigation state
  useEffect(() => {
    const s = (location.state as any)?.tab;
    if (s === 'studio') setActiveTab('studio');
  }, [location.state]);

  const loadStudioImages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("messages").select("content, images, created_at").not("images", "is", null).order("created_at", { ascending: false }).limit(100);
    if (data) {
      const imgs = data.flatMap(m => (m.images || []).filter((u: string) => !u.includes('.mp4') && !u.includes('video')).map((url: string) => ({ url, prompt: m.content, created_at: m.created_at })));
      setStudioImages(imgs);
    }
  };

  const loadCommunity = async () => {
    const { data } = await supabase.from("showcase_items").select("*").eq("media_type", "image").order("display_order", { ascending: true }).limit(50);
    if (data) setCommunityItems(data as any);
  };

  const allModels = [
    ...NEW_IMAGE_MODELS.map(m => ({ id: m.id, name: m.name, cost: m.cost, iconUrl: m.iconUrl, badge: m.badge })),
    ...dynamicModels.map(m => ({ id: m.id, name: m.name, cost: Number(m.credits) || 1, iconUrl: m.iconUrl || '', badge: (Number(m.credits) >= 3 ? 'PRO' : undefined) as 'PRO' | undefined })),
  ];

  const handleModelSelect = (modelId: string) => {
    setModelPickerOpen(false);
    navigate("/images/studio", { state: { selectedModelId: modelId } });
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'studio', label: 'Studio' },
    { id: 'community', label: 'Community' },
  ];

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="images" />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-foreground">Images</h1>
            <div className="w-9" />
          </div>
          <div className="flex bg-accent/50 rounded-2xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-28">
          {activeTab === 'home' && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold text-foreground">Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                {IMAGE_TOOLS.map((tool) => (
                  <motion.button
                    key={tool.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(tool.route)}
                    className="rounded-2xl overflow-hidden border border-border/30 bg-card text-left relative"
                  >
                    {tool.previewVideo ? (
                      <video src={tool.previewVideo} autoPlay loop muted playsInline className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-accent/30 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {tool.badge && (
                      <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tool.badge === 'NEW' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                        {tool.badge}
                      </span>
                    )}
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                      <span className="text-xs text-muted-foreground">{tool.cost} MC</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="pt-4">
              {studioImages.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No images generated yet</p>
                  <button onClick={() => setActiveTab('home')} className="mt-3 text-sm text-primary font-medium">Start creating →</button>
                </div>
              ) : (
                <div className="columns-2 gap-2">
                  {studioImages.map((img, i) => (
                    <div key={i} className="break-inside-avoid mb-2 rounded-2xl overflow-hidden">
                      <img src={img.url} alt={img.prompt} className="w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'community' && (
            <div className="pt-4">
              {communityItems.length === 0 ? (
                <p className="text-center py-20 text-muted-foreground text-sm">Community gallery coming soon</p>
              ) : (
                <div className="columns-2 gap-2">
                  {communityItems.map((item) => (
                    <div key={item.id} className="break-inside-avoid mb-3 rounded-2xl overflow-hidden border border-border/30 bg-card">
                      <img src={item.media_url} alt={item.prompt} className="w-full object-cover" loading="lazy" />
                      <div className="p-2 space-y-1">
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{item.prompt}</p>
                        <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(item.prompt || ''); toast.success("Copied"); }} className="text-[10px] text-primary font-medium">Copy Prompt</button>
                          <button onClick={() => { setPrompt(item.prompt || ''); setActiveTab('home'); }} className="text-[10px] text-primary font-medium">Reuse</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Input Bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
          <div className="max-w-3xl mx-auto relative pointer-events-auto">
            {/* Model Picker Sheet */}
            <AnimatePresence>
              {modelPickerOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setModelPickerOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card border border-border/50 rounded-2xl p-3 max-h-64 overflow-y-auto shadow-xl"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Select Model</p>
                    {allModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 text-left transition-colors"
                      >
                        {model.iconUrl && <img src={model.iconUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />}
                        <span className="flex-1 text-sm text-foreground truncate">{model.name}</span>
                        {model.badge && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${model.badge === 'NEW' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>{model.badge}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{model.cost} MC</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 rounded-[2rem] border border-primary/25 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-lg">
              <button
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Layers className="w-4 h-4" />
              </button>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && prompt.trim()) {
                    navigate("/images/studio", { state: { prompt: prompt.trim() } });
                  }
                }}
                placeholder="Describe what you want to create..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => { if (prompt.trim()) navigate("/images/studio", { state: { prompt: prompt.trim() } }); }}
                disabled={!prompt.trim()}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ImagesPage;
