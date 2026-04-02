import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Download, Copy, RefreshCw, X, Plus, User, Pencil, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { IMAGE_TOOLS } from "@/lib/imageToolsData";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = "home" | "studio" | "community";

const ALL_TOOLS = [
  { id: "inpaint", name: "Inpaint", desc: "Edit parts of an image", route: "/images/tools/inpaint", image: "/tool-previews/inpaint.png" },
  { id: "clothes-changer", name: "Clothes Changer", desc: "Change outfits", route: "/images/tools/clothes-changer", image: "https://j.top4top.io/p_3736n4ua61.jpeg" },
  { id: "headshot", name: "AI Headshot", desc: "Professional photos", route: "/images/tools/headshot", image: "https://freeimage.host/i/qiy3W3x" },
  { id: "face-swap", name: "Face Swap", desc: "Swap faces", route: "/images/tools/face-swap", image: "" },
  { id: "bg-remover", name: "BG Remover", desc: "Remove backgrounds", route: "/images/tools/bg-remover", image: "" },
  { id: "cartoon", name: "Cartoon", desc: "Cartoonify photos", route: "/images/tools/cartoon", image: "" },
  { id: "colorizer", name: "Colorizer", desc: "Colorize B&W", route: "/images/tools/colorizer", image: "" },
  { id: "retouching", name: "Retouch", desc: "Enhance photos", route: "/images/tools/retouching", image: "" },
  { id: "remover", name: "Object Remover", desc: "Remove objects", route: "/images/tools/remover", image: "" },
  { id: "sketch-to-image", name: "Sketch to Image", desc: "Convert sketches", route: "/images/tools/sketch-to-image", image: "" },
  { id: "relight", name: "Relight", desc: "Change lighting", route: "/images/tools/relight", image: "" },
  { id: "character-swap", name: "Character Swap", desc: "Swap characters", route: "/images/tools/character-swap", image: "" },
  { id: "storyboard", name: "Storyboard", desc: "Create panels", route: "/images/tools/storyboard", image: "" },
  { id: "hair-changer", name: "Hair Changer", desc: "Change hairstyles", route: "/images/tools/hair-changer", image: "" },
  { id: "avatar-maker", name: "Avatar Maker 3D", desc: "3D avatars", route: "/images/tools/avatar-maker", image: "" },
];

// Gradient colors for tools without images
const GRADIENTS = [
  "from-emerald-600/80 to-emerald-900/90",
  "from-rose-600/80 to-rose-900/90",
  "from-violet-600/80 to-violet-900/90",
  "from-amber-600/80 to-amber-900/90",
  "from-cyan-600/80 to-cyan-900/90",
  "from-pink-600/80 to-pink-900/90",
  "from-indigo-600/80 to-indigo-900/90",
  "from-teal-600/80 to-teal-900/90",
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

  const getToolImage = (toolId: string) => {
    const tool = IMAGE_TOOLS.find(t => t.id === toolId);
    return tool?.previewImage || tool?.previewVideo || "";
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {activeTab === "home" && (
            <div className="pt-3 space-y-4">
              {/* Tool Cards - Horizontal Scroll */}
              <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-3 min-w-max">
                  {ALL_TOOLS.map((tool, i) => {
                    const img = tool.image || getToolImage(tool.id);
                    const gradient = GRADIENTS[i % GRADIENTS.length];
                    return (
                      <motion.button
                        key={tool.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(tool.route)}
                        className="relative w-40 h-52 rounded-2xl overflow-hidden flex-shrink-0"
                      >
                        {img ? (
                          <img src={img} alt={tool.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{tool.desc}</p>
                          <p className="text-base font-bold text-white mt-0.5">{tool.name}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Create Your Image Card */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/images/agent")}
                className="w-full rounded-2xl overflow-hidden relative h-20 bg-card border border-border/30 flex items-center px-5 gap-4"
              >
                <div className="flex-1 text-left">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">CREATE</p>
                  <p className="text-lg font-bold text-foreground">Your Image</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
              </motion.button>

              {/* Community Card */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("community")}
                className="w-full rounded-2xl overflow-hidden relative h-20 bg-card border border-border/30 flex items-center px-5 gap-4"
              >
                <div className="flex-1 text-left">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">EXPLORE</p>
                  <p className="text-lg font-bold text-foreground">Community</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-foreground" />
                </div>
              </motion.button>
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

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-6 px-8 py-3 rounded-full bg-card/90 backdrop-blur-xl border border-border/30 shadow-lg">
            <button
              onClick={() => setActiveTab("home")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeTab === "home" ? "bg-primary" : "bg-transparent"}`}
            >
              <Square className={`w-3.5 h-3.5 ${activeTab === "home" ? "text-primary-foreground" : "text-muted-foreground"}`} fill={activeTab === "home" ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => setActiveTab("studio")}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Pencil className={`w-5 h-5 ${activeTab === "studio" ? "text-foreground" : "text-muted-foreground"}`} />
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className="w-8 h-8 flex items-center justify-center"
            >
              <User className={`w-5 h-5 ${activeTab === "community" ? "text-foreground" : "text-muted-foreground"}`} />
            </button>
          </div>
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
