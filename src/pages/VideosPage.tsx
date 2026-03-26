import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { VIDEO_TOOLS } from "@/lib/videoToolsData";
import { useModels } from "@/hooks/useModels";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = 'home' | 'studio' | 'community';

const VideosPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioVideos, setStudioVideos] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const { models: dynamicModels } = useModels("videos");

  useEffect(() => {
    if (activeTab === 'studio') loadStudioVideos();
    if (activeTab === 'community') loadCommunity();
  }, [activeTab]);

  const loadStudioVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("messages").select("content, images, created_at").not("images", "is", null).order("created_at", { ascending: false }).limit(50);
    if (data) {
      const vids = data.flatMap(m => (m.images || []).filter((u: string) => u.includes('.mp4') || u.includes('video')).map((url: string) => ({ url, prompt: m.content, created_at: m.created_at })));
      setStudioVideos(vids);
    }
  };

  const loadCommunity = async () => {
    const { data } = await supabase.from("showcase_items").select("*").eq("media_type", "video").order("display_order", { ascending: true }).limit(50);
    if (data) setCommunityItems(data as any);
  };

  const allModels = dynamicModels.map(m => ({
    id: m.id, name: m.name, cost: Number(m.credits) || 1,
    iconUrl: m.iconUrl || '',
    badge: (Number(m.credits) >= 3 ? 'PRO' : undefined) as 'PRO' | undefined,
  }));

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

          {/* TikTok-style tabs */}
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
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {activeTab === 'home' && (
            <div className="space-y-6 pt-4">
              {/* Tools Section */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Tools</h2>
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
                        <div className="w-full h-28 bg-accent/30 flex items-center justify-center">
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                      {tool.badge && (
                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tool.badge === 'NEW' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                          {tool.badge}
                        </span>
                      )}
                      <div className="p-2.5">
                        <p className="text-sm font-medium text-foreground">{tool.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tool.pricingDetails || `${tool.baseCost} MC`}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Models Section */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Models</h2>
                <div className="space-y-2">
                  {allModels.map((model) => (
                    <motion.button
                      key={model.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/videos/studio", { state: { selectedModelId: model.id } })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border/30 text-left"
                    >
                      {model.iconUrl && <img src={model.iconUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{model.name}</p>
                          {model.badge && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-white`}>{model.badge}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{model.cost} MC</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="pt-4">
              {studioVideos.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No videos generated yet</p>
                  <button onClick={() => setActiveTab('home')} className="mt-3 text-sm text-primary font-medium">Start creating →</button>
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
                    <div key={item.id} className="rounded-2xl overflow-hidden group relative">
                      <video src={item.media_url} controls className="w-full" />
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default VideosPage;
