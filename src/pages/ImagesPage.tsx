import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Send, SlidersHorizontal, Wand2, X, Download, Copy, RefreshCw, Home, Layers, Users, Eraser, ArrowUp, Palette, Pencil, Scissors, Sparkles, Camera, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { IMAGE_TOOLS, NEW_IMAGE_MODELS } from "@/lib/imageToolsData";
import { useDynamicModels } from "@/hooks/useModels";
import OrbLoader from "@/components/OrbLoader";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = "home" | "studio" | "community";
const FALLBACK_ICON = "/model-logos/megsy.png";

// Quick tools (circle icons)
const QUICK_TOOLS = [
  { id: "bg-remover", name: "BG Remove", icon: Eraser, route: "/images/tools/bg-remover" },
  { id: "retouching", name: "Retouch", icon: Sparkles, route: "/images/tools/retouching" },
  { id: "colorizer", name: "Colorize", icon: Palette, route: "/images/tools/colorizer" },
  { id: "cartoon", name: "Cartoon", icon: Pencil, route: "/images/tools/cartoon" },
  { id: "sketch-to-image", name: "Sketch", icon: Pencil, route: "/images/tools/sketch-to-image" },
  { id: "remover", name: "Remove", icon: Scissors, route: "/images/tools/remover" },
];

// Featured tools (big cards)
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
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string; iconUrl: string } | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [previewImg, setPreviewImg] = useState<{ url: string; prompt?: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultMedia, setResultMedia] = useState<{ url: string; prompt: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { models: dynamicModels } = useDynamicModels();

  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageCount, setImageCount] = useState(1);
  const [quality, setQuality] = useState("standard");
  const [negativePrompt, setNegativePrompt] = useState("");

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

  const imageModels = [
    ...NEW_IMAGE_MODELS.map(m => ({ id: m.id, name: m.name, cost: m.cost, iconUrl: m.iconUrl, badge: m.badge })),
    ...dynamicModels
      .filter(m => m.type === "image" || m.type === "image-tool")
      .map(m => ({ id: m.id, name: m.name, cost: Number(m.credits) || 1, iconUrl: m.iconUrl || "", badge: (Number(m.credits) >= 3 ? "PRO" : m.badges?.includes("NEW") ? "NEW" : undefined) as "NEW" | "PRO" | undefined })),
  ];

  const currentIcon = selectedModel?.iconUrl || FALLBACK_ICON;

  const handleModelSelect = (model: typeof imageModels[0]) => {
    setSelectedModel({ id: model.id, name: model.name, iconUrl: model.iconUrl });
    setModelPickerOpen(false);
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please login first"); setGenerating(false); return; }

      // Create conversation
      const { data: conv } = await supabase.from("conversations").insert({ user_id: user.id, title: prompt.trim().slice(0, 50), mode: "images" }).select().single();
      if (!conv) throw new Error("Failed to create conversation");

      // Save user message
      await supabase.from("messages").insert({ conversation_id: conv.id, role: "user", content: prompt.trim() });

      // Generate image
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: prompt.trim(),
          model: selectedModel?.id || "nano-banana",
          aspectRatio,
          quality,
          negativePrompt,
          imageCount,
        },
      });
      if (error) throw error;
      const urls = data?.images || data?.url ? [data.url] : [];
      if (urls.length === 0) throw new Error("No images generated");

      // Save assistant message
      await supabase.from("messages").insert({ conversation_id: conv.id, role: "assistant", content: prompt.trim(), images: urls });

      setResultMedia({ url: urls[0], prompt: prompt.trim() });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setGenerating(false);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-prompt", { body: { prompt: prompt.trim(), type: "image" } });
      if (error) throw error;
      if (data?.enhanced) { setPrompt(data.enhanced); toast.success("Prompt enhanced"); }
    } catch { toast.error("Enhancement failed"); }
    setEnhancing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  const getToolPreview = (toolId: string) => {
    const tool = IMAGE_TOOLS.find(t => t.id === toolId);
    return tool?.previewImage || tool?.previewVideo;
  };

  // Result view
  if (resultMedia) {
    return (
      <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
        <div className="h-full flex flex-col bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
            <button onClick={() => setResultMedia(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-foreground flex-1 truncate">Result</h1>
          </div>
          {/* Image */}
          <div className="flex-1 overflow-y-auto px-4 pb-36 flex flex-col items-center justify-center">
            <img src={resultMedia.url} alt="" className="max-w-full max-h-[60vh] rounded-2xl object-contain" />
            <a href={resultMedia.url} download className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
          {/* Input bar for re-generation */}
          <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 rounded-2xl border border-border/30 bg-background/90 backdrop-blur-xl px-3 py-3 shadow-lg">
                <textarea
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setResultMedia(null); handleSend(); } }}
                  placeholder="Generate another..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-2.5 max-h-[150px]"
                  style={{ minHeight: "44px" }}
                />
                <button onClick={() => { setResultMedia(null); handleSend(); }} disabled={!prompt.trim()} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="images" />
        <OrbLoader visible={generating} />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Images</h1>
            <div className="w-9" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-44">
          {activeTab === "home" && (
            <div className="pt-3 space-y-5">
              {/* Community Card */}
              <button
                onClick={() => setActiveTab("community")}
                className="w-full rounded-2xl overflow-hidden relative h-28 bg-gradient-to-r from-primary/80 to-primary/40"
              >
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 text-left">
                    <p className="text-lg font-bold text-primary-foreground">Community</p>
                    <p className="text-xs text-primary-foreground/70 mt-0.5">Explore amazing creations</p>
                  </div>
                  <Users className="w-10 h-10 text-primary-foreground/30" />
                </div>
              </button>

              {/* Quick Tools - Scrollable circles */}
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

              {/* Featured Tools - Big cards */}
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
                  <button onClick={() => setActiveTab("home")} className="mt-3 text-sm text-primary font-medium">Start creating</button>
                </div>
              ) : (
                <div className="columns-2 gap-2.5">
                  {studioImages.map((img, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.98 }} className="break-inside-avoid mb-2.5 rounded-2xl overflow-hidden cursor-pointer group relative" onClick={() => setPreviewImg(img)}>
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
                      <div className="rounded-2xl overflow-hidden">
                        <img src={item.media_url} alt="" className="w-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={() => { navigator.clipboard.writeText(item.prompt || ""); toast.success("Copied"); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium bg-accent/60 text-foreground">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <button onClick={() => { setPrompt(item.prompt || ""); setActiveTab("home"); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium bg-primary text-primary-foreground">
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

        {/* Floating Input Bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-1 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            {/* Model Picker */}
            <AnimatePresence>
              {modelPickerOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/30" onClick={() => setModelPickerOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/30 rounded-2xl p-3 max-h-80 overflow-y-auto shadow-2xl">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 px-1">Image Models</p>
                    <div className="space-y-0.5">
                      {imageModels.map(model => (
                        <button key={model.id} onClick={() => handleModelSelect(model)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${selectedModel?.id === model.id ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent/50"}`}>
                          {model.iconUrl && <img src={model.iconUrl} alt="" className="w-7 h-7 rounded-lg object-contain" />}
                          <span className="flex-1 text-sm text-foreground truncate">{model.name}</span>
                          {model.badge && <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${model.badge === "NEW" ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"}`}>{model.badge}</span>}
                          <span className="text-xs text-muted-foreground">{model.cost} MC</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Settings Panel */}
            <AnimatePresence>
              {settingsOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/30" onClick={() => setSettingsOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-foreground">Settings</p>
                      <button onClick={() => setSettingsOpen(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Aspect Ratio</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"].map(r => (
                            <button key={r} onClick={() => setAspectRatio(r)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${aspectRatio === r ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Quality</p>
                        <div className="flex gap-1.5">
                          {["standard", "hd", "4k"].map(q => (
                            <button key={q} onClick={() => setQuality(q)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${quality === q ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>{q}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Images: {imageCount}</p>
                        <input type="range" min={1} max={4} value={imageCount} onChange={e => setImageCount(Number(e.target.value))} className="w-full accent-primary" />
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="rounded-2xl border border-border/30 bg-background/90 backdrop-blur-xl px-3 py-2.5 shadow-lg">
              <div className="flex items-end gap-2">
                <button onClick={() => { setModelPickerOpen(!modelPickerOpen); setSettingsOpen(false); }} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent/50 transition-colors">
                  <img src={currentIcon} alt="" className="w-6 h-6 rounded-lg object-contain" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Describe what you want to create..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-2 max-h-[120px]"
                  style={{ minHeight: "36px" }}
                />
                <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || enhancing} className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary disabled:opacity-30 ${enhancing ? "animate-spin" : ""}`}>
                  <Wand2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setSettingsOpen(!settingsOpen); setModelPickerOpen(false); }} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button onClick={handleSend} disabled={!prompt.trim()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20">
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1 pl-11">{selectedModel?.name || "Nano Banana"} • 1 MC</p>
            </div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-around mt-2 py-2">
              <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-0.5 ${activeTab === "home" ? "text-primary" : "text-muted-foreground/50"}`}>
                <Home className="w-5 h-5" />
                <span className="text-[10px]">Home</span>
              </button>
              <button onClick={() => setActiveTab("studio")} className={`flex flex-col items-center gap-0.5 ${activeTab === "studio" ? "text-primary" : "text-muted-foreground/50"}`}>
                <Layers className="w-5 h-5" />
                <span className="text-[10px]">Studio</span>
              </button>
              <button onClick={() => setActiveTab("community")} className={`flex flex-col items-center gap-0.5 ${activeTab === "community" ? "text-primary" : "text-muted-foreground/50"}`}>
                <Users className="w-5 h-5" />
                <span className="text-[10px]">Community</span>
              </button>
            </div>
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
