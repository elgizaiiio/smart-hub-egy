import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Download, Copy, RefreshCw, Home, Layers, Users, Eraser, Palette, Pencil, Scissors, Sparkles, Camera, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { IMAGE_TOOLS } from "@/lib/imageToolsData";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = "home" | "studio" | "community";

const QUICK_TOOLS = [
  { id: "bg-remover", name: "BG Remove", icon: Eraser, route: "/images/tools/bg-remover" },
  { id: "retouching", name: "Retouch", icon: Sparkles, route: "/images/tools/retouching" },
  { id: "colorizer", name: "Colorize", icon: Palette, route: "/images/tools/colorizer" },
  { id: "cartoon", name: "Cartoon", icon: Pencil, route: "/images/tools/cartoon" },
  { id: "sketch-to-image", name: "Sketch", icon: Pencil, route: "/images/tools/sketch-to-image" },
  { id: "remover", name: "Remove", icon: Scissors, route: "/images/tools/remover" },
];

const FEATURED_TOOLS = [
  { id: "inpaint", name: "Inpaint", desc: "Edit parts of an image with AI", route: "/images/tools/inpaint" },
  { id: "clothes-changer", name: "Clothes Changer", desc: "Change outfits with AI styles", route: "/images/tools/clothes-changer" },
  { id: "headshot", name: "AI Headshot", desc: "Professional headshot photos", route: "/images/tools/headshot" },
  { id: "face-swap", name: "Face Swap", desc: "Swap faces between photos", route: "/images/tools/face-swap" },
];

const ImagesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>((location.state as any)?.tab || "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioImages, setStudioImages] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [previewImg, setPreviewImg] = useState<{ url: string; prompt?: string } | null>(null);

  useEffect(() => {
    if (activeTab === "studio") loadStudioImages();
    if (activeTab === "community") loadCommunity();
  }, [activeTab]);

  useEffect(() => {
    const s = (location.state as any)?.tab;
    if (s === "studio") setActiveTab("studio");
  }, [location.state]);

  const loadStudioImages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "images");
    if (!convs || convs.length === 0) { setStudioImages([]); return; }
    const convIds = convs.map(c => c.id);
    const { data } = await supabase.from("messages").select("content, images, created_at").eq("role", "assistant").not("images", "is", null).in("conversation_id", convIds).order("created_at", { ascending: false }).limit(200);
    if (data) {
      const imgs = data.flatMap(m => (m.images || []).filter((u: string) => !u.includes(".mp4") && !u.includes("video")).map((url: string) => ({ url, prompt: m.content?.slice(0, 200) || "", created_at: m.created_at })));
      setStudioImages(imgs);
    }
  };

  const loadCommunity = async () => {
    const { data } = await supabase.from("showcase_items").select("*").eq("media_type", "image").order("display_order", { ascending: true }).limit(50);
    if (data) setCommunityItems(data as any);
  };

  const getToolPreview = (toolId: string) => {
    const tool = IMAGE_TOOLS.find(t => t.id === toolId);
    return tool?.previewImage || tool?.previewVideo;
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="images" />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Images</h1>
            <div className="w-9" />
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-2">
            {(["home", "studio", "community"] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
              >
                {tab === "home" ? "Home" : tab === "studio" ? "Studio" : "Community"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {activeTab === "home" && (
            <div className="pt-3 space-y-5">
              {/* Create Button */}
              <button
                onClick={() => navigate("/images/agent")}
                className="w-full rounded-2xl overflow-hidden relative h-24 bg-gradient-to-r from-primary to-primary/60 flex items-center px-5 gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-primary-foreground">Create Image</p>
                  <p className="text-xs text-primary-foreground/70">Generate with AI models</p>
                </div>
              </button>

              {/* Community Card */}
              <button
                onClick={() => setActiveTab("community")}
                className="w-full rounded-2xl overflow-hidden relative h-20 bg-gradient-to-r from-accent to-accent/40 flex items-center px-5"
              >
                <div className="flex-1 text-left">
                  <p className="text-base font-bold text-foreground">Community</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Explore amazing creations</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </button>

              {/* Quick Tools */}
              <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-4 min-w-max">
                  {QUICK_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <button key={tool.id} onClick={() => navigate(tool.route)} className="flex flex-col items-center gap-1.5 min-w-[60px]">
                        <div className="w-14 h-14 rounded-full bg-accent/60 flex items-center justify-center border border-border/20 hover:bg-accent transition-colors">
                          <Icon className="w-5 h-5 text-foreground" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Featured Tools */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Featured Tools</p>
                <div className="grid grid-cols-2 gap-3">
                  {FEATURED_TOOLS.map(tool => {
                    const preview = getToolPreview(tool.id);
                    return (
                      <motion.button
                        key={tool.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(tool.route)}
                        className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left"
                      >
                        {preview ? (
                          preview.includes(".mp4") ? (
                            <video src={preview} autoPlay loop muted playsInline className="w-full h-28 object-cover" />
                          ) : (
                            <img src={preview} alt={tool.name} className="w-full h-28 object-cover" />
                          )
                        ) : (
                          <div className="w-full h-28 bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{tool.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "studio" && (
            <div className="pt-4">
              {studioImages.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No images generated yet</p>
                  <button onClick={() => navigate("/images/agent")} className="mt-3 text-sm text-primary font-medium">Start creating</button>
                </div>
              ) : (
                <div className="columns-2 gap-2.5">
                  {studioImages.map((img, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.98 }} className="break-inside-avoid mb-2.5 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setPreviewImg(img)}>
                      <img src={img.url} alt="" className="w-full object-cover" loading="lazy" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "community" && (
            <div className="pt-4">
              {communityItems.length === 0 ? (
                <p className="text-center py-20 text-muted-foreground text-sm">Community gallery coming soon</p>
              ) : (
                <div className="columns-2 gap-2.5">
                  {communityItems.map(item => (
                    <div key={item.id} className="break-inside-avoid mb-3">
                      <div className="rounded-2xl overflow-hidden cursor-pointer" onClick={() => setPreviewImg({ url: item.media_url, prompt: item.prompt })}>
                        <img src={item.media_url} alt="" className="w-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={() => { navigator.clipboard.writeText(item.prompt || ""); toast.success("Copied"); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium bg-accent/60 text-foreground">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <button onClick={() => navigate("/images/agent", { state: { prompt: item.prompt } })} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium bg-primary text-primary-foreground">
                          <RefreshCw className="w-3 h-3" /> Reuse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {previewImg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <img src={previewImg.url} alt="" className="w-full rounded-2xl object-contain max-h-[70vh]" />
                {previewImg.prompt && <p className="text-white/50 text-xs mt-3 text-center line-clamp-2">{previewImg.prompt}</p>}
                <div className="flex justify-center mt-3">
                  <a href={previewImg.url} download className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground">
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
                <button onClick={() => setPreviewImg(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default ImagesPage;
