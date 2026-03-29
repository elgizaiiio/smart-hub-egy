import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, ArrowUp, Settings2, Wand2, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { IMAGE_TOOLS, NEW_IMAGE_MODELS } from "@/lib/imageToolsData";
import { useDynamicModels } from "@/hooks/useModels";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = "home" | "studio" | "community";
const FALLBACK_ICON = "/model-logos/megsy.png";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { models: dynamicModels } = useDynamicModels();

  // Settings state
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
    // Get only images from conversations with mode='images'
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

  const handleSend = () => {
    if (!prompt.trim()) return;
    navigate("/images/studio", { state: { prompt: prompt.trim(), selectedModelId: selectedModel?.id, settings: { aspectRatio, imageCount, quality, negativePrompt } } });
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "studio", label: "Studio" },
    { id: "community", label: "Community" },
  ];

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="images" />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Images</h1>
            <div className="w-9" />
          </div>
          <div className="flex bg-accent/50 rounded-2xl p-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-36">
          {activeTab === "home" && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold text-foreground">Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                {IMAGE_TOOLS.map(tool => (
                  <motion.button key={tool.id} whileTap={{ scale: 0.97 }} onClick={() => navigate(tool.route)} className="rounded-2xl overflow-hidden border border-border/30 bg-card text-left relative">
                    {tool.previewVideo ? <video src={tool.previewVideo} autoPlay loop muted playsInline className="w-full h-28 object-cover" /> : <div className="w-full h-28 bg-accent/30" />}
                    {tool.badge && <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tool.badge === "NEW" ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"}`}>{tool.badge}</span>}
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                      <span className="text-xs text-muted-foreground">{tool.cost} MC</span>
                    </div>
                  </motion.button>
                ))}
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
                <div className="columns-2 gap-2">
                  {studioImages.map((img, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.98 }} className="break-inside-avoid mb-2 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setPreviewImg(img)}>
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
                <div className="columns-2 gap-2">
                  {communityItems.map(item => (
                    <div key={item.id} className="break-inside-avoid mb-3">
                      <div className="rounded-2xl overflow-hidden">
                        <img src={item.media_url} alt="" className="w-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex gap-2 mt-1.5">
                        <button onClick={() => { navigator.clipboard.writeText(item.prompt || ""); toast.success("Copied"); }} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Copy</button>
                        <button onClick={() => { setPrompt(item.prompt || ""); setActiveTab("home"); }} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Reuse</button>
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
            {/* Model Picker */}
            <AnimatePresence>
              {modelPickerOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/20" onClick={() => setModelPickerOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl p-3 max-h-80 overflow-y-auto shadow-xl">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">Image Models</p>
                    <div className="space-y-1">
                      {imageModels.map(model => (
                        <button key={model.id} onClick={() => handleModelSelect(model)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${selectedModel?.id === model.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"}`}>
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/20" onClick={() => setSettingsOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-foreground">Settings</p>
                      <button onClick={() => setSettingsOpen(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Aspect Ratio</p>
                        <div className="flex flex-wrap gap-2">
                          {["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"].map(r => (
                            <button key={r} onClick={() => setAspectRatio(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${aspectRatio === r ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground hover:bg-accent"}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Quality</p>
                        <div className="flex gap-2">
                          {["standard", "hd", "4k"].map(q => (
                            <button key={q} onClick={() => setQuality(q)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${quality === q ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground hover:bg-accent"}`}>{q}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Images: {imageCount}</p>
                        <input type="range" min={1} max={4} value={imageCount} onChange={e => setImageCount(Number(e.target.value))} className="w-full accent-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Negative Prompt</p>
                        <input value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} placeholder="What to avoid..." className="w-full bg-accent/30 border border-border/30 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none" />
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-5 py-5 shadow-lg">
              <button onClick={() => { setModelPickerOpen(!modelPickerOpen); setSettingsOpen(false); }} className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-accent/50 transition-colors" title={selectedModel?.name || "Select model"}>
                <img src={currentIcon} alt="" className="w-7 h-7 rounded-md object-contain" />
              </button>
              <textarea ref={textareaRef} value={prompt} onChange={handleTextareaChange} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Describe what you want to create..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-3 max-h-[150px]" style={{ minHeight: "56px" }} />
              <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || enhancing} className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 ${enhancing ? "animate-spin" : ""}`} title="Enhance prompt">
                <Wand2 className="w-5 h-5" />
              </button>
              <button onClick={() => { setSettingsOpen(!settingsOpen); setModelPickerOpen(false); }} className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <Settings2 className="w-5 h-5" />
              </button>
              <button onClick={handleSend} disabled={!prompt.trim()} className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-colors">
                <ArrowUp className="w-5 h-5" />
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
                {previewImg.prompt && <p className="text-white/60 text-xs mt-3 text-center line-clamp-2">{previewImg.prompt}</p>}
                <div className="flex justify-center mt-3">
                  <a href={previewImg.url} download className="fancy-btn">
                    <span className="fold" />
                    <div className="points_wrapper">{Array.from({ length: 8 }).map((_, i) => <span key={i} className="point" />)}</div>
                    <span className="inner flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Download
                    </span>
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
