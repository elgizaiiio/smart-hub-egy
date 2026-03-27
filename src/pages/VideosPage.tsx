import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, ArrowUp, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { VIDEO_TOOLS } from "@/lib/videoToolsData";
import { useDynamicModels } from "@/hooks/useModels";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = 'home' | 'studio' | 'community';

const FALLBACK_ICON = "/model-logos/megsy.png";

const VideosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>((location.state as any)?.tab || 'home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioVideos, setStudioVideos] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string; iconUrl: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { models: dynamicModels } = useDynamicModels();

  useEffect(() => {
    if (activeTab === 'studio') loadStudioVideos();
    if (activeTab === 'community') loadCommunity();
  }, [activeTab]);

  useEffect(() => {
    const s = (location.state as any)?.tab;
    if (s === 'studio') setActiveTab('studio');
  }, [location.state]);

  const loadStudioVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("messages").select("content, images, created_at").eq("role", "assistant").not("images", "is", null).order("created_at", { ascending: false }).limit(50);
    if (data) {
      const vids = data.flatMap(m => (m.images || []).filter((u: string) => u.includes('.mp4') || u.includes('video')).map((url: string) => ({ url, prompt: m.content, created_at: m.created_at })));
      setStudioVideos(vids);
    }
  };

  const loadCommunity = async () => {
    const { data } = await supabase.from("showcase_items").select("*").eq("media_type", "video").order("display_order", { ascending: true }).limit(50);
    if (data) setCommunityItems(data as any);
  };

  // Filter only video models
  const videoModels = dynamicModels
    .filter(m => m.type === 'video' || m.type === 'video-i2v' || m.type === 'video-avatar' || m.type === 'video-effect' || m.type === 'video-motion')
    .map(m => ({ id: m.id, name: m.name, cost: Number(m.credits) || 1, iconUrl: m.iconUrl || '', badge: (Number(m.credits) >= 3 ? 'PRO' : m.badges?.includes('NEW') ? 'NEW' : undefined) as 'NEW' | 'PRO' | undefined }));

  const currentIcon = selectedModel?.iconUrl || FALLBACK_ICON;

  const handleModelSelect = (model: typeof videoModels[0]) => {
    setSelectedModel({ id: model.id, name: model.name, iconUrl: model.iconUrl });
    setModelPickerOpen(false);
  };

  const handleSend = () => {
    if (!prompt.trim()) return;
    navigate("/videos/studio", { state: { prompt: prompt.trim(), selectedModelId: selectedModel?.id } });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'studio', label: 'Studio' },
    { id: 'community', label: 'Community' },
  ];

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="videos" />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-foreground">Videos</h1>
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
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {activeTab === 'home' && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold text-foreground">Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                {VIDEO_TOOLS.map((tool) => (
                  <motion.button
                    key={tool.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(tool.route)}
                    className="rounded-2xl overflow-hidden border border-border/30 bg-card text-left relative"
                  >
                    {tool.previewVideo ? (
                      <video src={tool.previewVideo} autoPlay loop muted playsInline className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-accent/30" />
                    )}
                    {tool.badge && (
                      <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tool.badge === 'NEW' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                        {tool.badge}
                      </span>
                    )}
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                      <span className="text-xs text-muted-foreground">{tool.pricingDetails || `${tool.baseCost} MC`}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="pt-4">
              {studioVideos.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No videos generated yet</p>
                  <button onClick={() => setActiveTab('home')} className="mt-3 text-sm text-primary font-medium">Start creating</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studioVideos.map((vid, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden">
                      <video src={vid.url} controls className="w-full" />
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
                <div className="space-y-3">
                  {communityItems.map((item) => (
                    <div key={item.id} className="rounded-2xl overflow-hidden bg-card border border-border/30">
                      <video src={item.media_url} autoPlay muted loop playsInline className="w-full" />
                      <div className="p-2 flex gap-2">
                        <button
                          onClick={() => { navigator.clipboard.writeText(item.prompt || ''); toast.success("Copied"); }}
                          className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold text-primary-foreground fancy-btn-bg transition-all"
                        >
                          Copy Prompt
                        </button>
                        <button
                          onClick={() => { setPrompt(item.prompt || ''); setActiveTab('home'); }}
                          className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold text-primary-foreground fancy-btn-bg transition-all"
                        >
                          Reuse
                        </button>
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
            <AnimatePresence>
              {modelPickerOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/20" onClick={() => setModelPickerOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl p-3 max-h-64 overflow-y-auto shadow-xl"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Video Models</p>
                    {videoModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 text-left transition-colors"
                      >
                        {model.iconUrl && <img src={model.iconUrl} alt="" className="w-6 h-6 rounded-lg object-contain" />}
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

            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 py-2.5 shadow-lg">
              <button
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent/50 transition-colors"
                title={selectedModel?.name || "Select model"}
              >
                <img src={currentIcon} alt="" className="w-6 h-6 rounded-md object-contain" />
              </button>

              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Describe your video..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2 max-h-[120px]"
                style={{ minHeight: '36px' }}
              />

              <button
                onClick={() => toast.info("Settings coming soon")}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-colors"
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

export default VideosPage;
