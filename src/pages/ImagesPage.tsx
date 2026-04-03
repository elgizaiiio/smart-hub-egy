import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Download, RefreshCw, ArrowLeft, Wand2, Compass, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { IMAGE_TOOLS } from "@/lib/imageToolsData";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import type { ModelOption } from "@/components/ModelSelector";
import UnifiedInputBar from "@/components/UnifiedInputBar";
import createImageCard from "@/assets/create-image-card.jpg";
import editImageCard from "@/assets/edit-image-card.jpg";

type Tab = "home" | "studio" | "community";

const NANO_BANANA_DEFAULT: ModelOption = {
  id: "nano-banana",
  name: "Nano Banana",
  credits: "1",
  iconUrl: "/model-logos/nano-banana.jpg",
};

const ALL_TOOLS = [
  { id: "inpaint", name: "Inpaint", route: "/images/tools/inpaint" },
  { id: "clothes-changer", name: "Clothes Changer", route: "/images/tools/clothes-changer" },
  { id: "headshot", name: "AI Headshot", route: "/images/tools/headshot" },
  { id: "face-swap", name: "Face Swap", route: "/images/tools/face-swap" },
  { id: "bg-remover", name: "BG Remover", route: "/images/tools/bg-remover" },
  { id: "cartoon", name: "Cartoon", route: "/images/tools/cartoon" },
  { id: "colorizer", name: "Colorizer", route: "/images/tools/colorizer" },
  { id: "retouching", name: "Retouch", route: "/images/tools/retouching" },
  { id: "remover", name: "Object Remover", route: "/images/tools/remover" },
  { id: "sketch-to-image", name: "Sketch to Image", route: "/images/tools/sketch-to-image" },
  { id: "relight", name: "Relight", route: "/images/tools/relight" },
  { id: "character-swap", name: "Character Swap", route: "/images/tools/character-swap" },
  { id: "storyboard", name: "Storyboard", route: "/images/tools/storyboard" },
  { id: "hair-changer", name: "Hair Changer", route: "/images/tools/hair-changer" },
];

const TOOL_ROWS = [
  ALL_TOOLS.slice(0, Math.ceil(ALL_TOOLS.length / 2)),
  ALL_TOOLS.slice(Math.ceil(ALL_TOOLS.length / 2)),
];

const TOOL_GRADIENTS: Record<string, string> = {
  "inpaint": "from-blue-500 via-blue-600 to-indigo-700",
  "clothes-changer": "from-rose-500 via-rose-600 to-red-700",
  "headshot": "from-amber-500 via-amber-600 to-orange-700",
  "face-swap": "from-violet-500 via-violet-600 to-purple-700",
  "bg-remover": "from-cyan-500 via-cyan-600 to-teal-700",
  "cartoon": "from-pink-500 via-pink-600 to-fuchsia-700",
  "colorizer": "from-emerald-500 via-emerald-600 to-green-700",
  "retouching": "from-sky-500 via-sky-600 to-blue-700",
  "remover": "from-slate-500 via-slate-600 to-zinc-700",
  "sketch-to-image": "from-lime-500 via-lime-600 to-emerald-700",
  "relight": "from-yellow-500 via-yellow-600 to-amber-700",
  "character-swap": "from-fuchsia-500 via-fuchsia-600 to-pink-700",
  "storyboard": "from-indigo-500 via-indigo-600 to-violet-700",
  "hair-changer": "from-teal-500 via-teal-600 to-cyan-700",
};

const IMAGE_PLACEHOLDERS = [
  "A futuristic city at sunset in cyberpunk style...",
  "Portrait of a woman in golden light...",
  "Anime character in a magical forest...",
  "Abstract art with vibrant colors...",
];

const HERO_TEXTS = [
  { main: "Create something", accent: "extraordinary" },
  { main: "Imagine it", accent: "generate it" },
  { main: "Your vision", accent: "AI-powered" },
  { main: "Dream big", accent: "create bigger" },
];

const ImagesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>((location.state as any)?.tab || "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioImages, setStudioImages] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [previewImg, setPreviewImg] = useState<{ url: string; prompt?: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(NANO_BANANA_DEFAULT);
  const [toolLandingImages, setToolLandingImages] = useState<Record<string, string>>({});
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "studio") loadStudioImages();
    if (activeTab === "community") loadCommunity();
  }, [activeTab]);

  useEffect(() => {
    const s = (location.state as any)?.tab;
    if (s === "studio") setActiveTab("studio");
  }, [location.state]);

  useEffect(() => { loadToolLandingImages(); }, []);

  useEffect(() => {
    const interval = setInterval(() => setHeroIdx(i => (i + 1) % HERO_TEXTS.length), 4000);
    return () => clearInterval(interval);
  }, []);

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

  const loadToolLandingImages = async () => {
    // Try cache first
    const cached = localStorage.getItem("megsy_tool_images_img");
    if (cached) {
      try { setToolLandingImages(JSON.parse(cached)); } catch {}
    }
    const { data } = await supabase.from("tool_landing_images").select("tool_id, image_url").in("tool_id", ALL_TOOLS.map(t => t.id));
    if (!data) return;
    const map = data.reduce<Record<string, string>>((acc, item) => { if (item.image_url) acc[item.tool_id] = item.image_url; return acc; }, {});
    setToolLandingImages(map);
    localStorage.setItem("megsy_tool_images_img", JSON.stringify(map));
  };

  const getToolImage = (toolId: string) => {
    if (toolLandingImages[toolId]) return toolLandingImages[toolId];
    const tool = IMAGE_TOOLS.find(t => t.id === toolId);
    return tool?.previewImage || tool?.previewVideo || "";
  };

  const handleGenerate = () => {
    if (!prompt.trim() && !attachedImage) return;
    navigate("/images/studio", { state: { prompt: prompt.trim(), attachedImage, model: selectedModel } });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (previewImg) {
    return (
      <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
        <div className="h-full flex flex-col bg-background">
          <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3 border-b border-border/30">
            <button onClick={() => setPreviewImg(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground flex-1">Preview</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border/20"><img src={previewImg.url} alt="" className="w-full object-contain" /></div>
            <div className="flex gap-3">
              <a href={previewImg.url} download className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"><Download className="w-4 h-4" /> Download</a>
              {previewImg.prompt && (
                <button onClick={() => { navigate("/images/studio", { state: { prompt: previewImg.prompt } }); setPreviewImg(null); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm"><RefreshCw className="w-4 h-4" /> Reuse</button>
              )}
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
        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="images" selectedModelId={selectedModel.id} />

        <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <div className="w-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {activeTab === "home" && (
            <div className="pt-2 space-y-5">
              {/* Hero text - bigger, no commas */}
              <div className="text-center py-3">
                <AnimatePresence mode="wait">
                  <motion.div key={heroIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
                    <p className="text-2xl font-extrabold text-foreground leading-tight">{HERO_TEXTS[heroIdx].main}</p>
                    <p className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent leading-tight">{HERO_TEXTS[heroIdx].accent}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Input bar - bigger, no borders, rectangular */}
              <UnifiedInputBar
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                onAttach={() => fileInputRef.current?.click()}
                onModelPick={() => setModelPickerOpen(true)}
                modelIcon={selectedModel.iconUrl}
                modelName={selectedModel.name}
                showModelPicker
                placeholders={IMAGE_PLACEHOLDERS}
                attachedImage={attachedImage}
                onClearAttachment={() => setAttachedImage(null)}
                className="min-h-[72px]"
              />

              <div className="space-y-3">
                {TOOL_ROWS.map((row, rowIndex) => (
                  <div key={rowIndex} className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                    <div className="flex min-w-max gap-3">
                      {row.map((tool) => {
                        const gradient = TOOL_GRADIENTS[tool.id] || "from-gray-500 to-gray-700";
                        return (
                          <motion.button key={tool.id} whileTap={{ scale: 0.96 }} onClick={() => navigate(tool.route)} className="relative h-56 w-44 flex-shrink-0 overflow-hidden rounded-2xl">
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.2),transparent_60%)]" />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <p className="text-[11px] uppercase tracking-[0.2em] font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent text-center leading-relaxed">{tool.name}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/images/studio")} className="relative flex h-32 w-full items-center overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/20 to-primary/5">
                <div className="absolute inset-y-0 right-0 w-[42%] overflow-hidden">
                  <img src={createImageCard} alt="Create" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-l from-background/10 via-background/20 to-transparent" />
                </div>
                <div className="relative flex-1 text-left px-5 pr-[38%]">
                  <p className="text-lg font-bold text-foreground">Create Your Image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Generate images with AI</p>
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/images/studio")} className="relative flex h-32 w-full items-center overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-r from-accent/30 to-accent/5">
                <div className="absolute inset-y-0 right-0 w-[42%] overflow-hidden">
                  <img src={editImageCard} alt="Edit" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-l from-background/10 via-background/20 to-transparent" />
                </div>
                <div className="relative flex-1 text-left px-5 pr-[38%]">
                  <p className="text-lg font-bold text-foreground">Edit Your Image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Transform existing images</p>
                </div>
              </motion.button>
            </div>
          )}

          {activeTab === "studio" && (
            <div className="pt-4">
              {studioImages.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No images generated yet</p>
                  <button onClick={() => navigate("/images/studio")} className="mt-3 text-sm text-primary font-medium">Start creating</button>
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
                    <div key={item.id} className="break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setPreviewImg({ url: item.media_url, prompt: item.prompt })}>
                      <img src={item.media_url} alt="" className="w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-8 px-8 py-3 rounded-full bg-card/90 backdrop-blur-xl border border-border/30 shadow-lg">
            <button onClick={() => setActiveTab("home")} className="flex flex-col items-center gap-0.5">
              <LayoutGrid className={`w-5 h-5 ${activeTab === "home" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={activeTab === "home" ? 2.5 : 1.8} />
            </button>
            <button onClick={() => setActiveTab("studio")} className="flex flex-col items-center gap-0.5">
              <Wand2 className={`w-5 h-5 ${activeTab === "studio" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={activeTab === "studio" ? 2.5 : 1.8} />
            </button>
            <button onClick={() => setActiveTab("community")} className="flex flex-col items-center gap-0.5">
              <Compass className={`w-5 h-5 ${activeTab === "community" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={activeTab === "community" ? 2.5 : 1.8} />
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
    </AppLayout>
  );
};

export default ImagesPage;
