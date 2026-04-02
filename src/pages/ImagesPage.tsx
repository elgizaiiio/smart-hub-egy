import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Download, RefreshCw, ArrowLeft, Wand2, Compass, LayoutGrid, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import type { ModelOption } from "@/components/ModelSelector";
import UnifiedInputBar from "@/components/UnifiedInputBar";
import ToolCardGrid from "@/components/ToolCardGrid";

type Tab = "home" | "studio" | "community";

const NANO_BANANA_DEFAULT: ModelOption = {
  id: "nano-banana",
  name: "Nano Banana",
  credits: "1",
  iconUrl: "/model-logos/bytedance.ico",
};

const ALL_TOOLS = [
  { id: "inpaint", name: "Inpaint", desc: "Edit parts of an image", route: "/images/tools/inpaint" },
  { id: "clothes-changer", name: "Clothes Changer", desc: "Change outfits", route: "/images/tools/clothes-changer" },
  { id: "headshot", name: "AI Headshot", desc: "Professional photos", route: "/images/tools/headshot" },
  { id: "face-swap", name: "Face Swap", desc: "Swap faces", route: "/images/tools/face-swap" },
  { id: "bg-remover", name: "BG Remover", desc: "Remove backgrounds", route: "/images/tools/bg-remover" },
  { id: "cartoon", name: "Cartoon", desc: "Cartoonify photos", route: "/images/tools/cartoon" },
  { id: "colorizer", name: "Colorizer", desc: "Colorize B&W", route: "/images/tools/colorizer" },
  { id: "retouching", name: "Retouch", desc: "Enhance photos", route: "/images/tools/retouching" },
  { id: "remover", name: "Object Remover", desc: "Remove objects", route: "/images/tools/remover" },
  { id: "sketch-to-image", name: "Sketch to Image", desc: "Convert sketches", route: "/images/tools/sketch-to-image" },
  { id: "relight", name: "Relight", desc: "Change lighting", route: "/images/tools/relight" },
  { id: "character-swap", name: "Character Swap", desc: "Swap characters", route: "/images/tools/character-swap" },
  { id: "storyboard", name: "Storyboard", desc: "Create panels", route: "/images/tools/storyboard" },
  { id: "hair-changer", name: "Hair Changer", desc: "Change hairstyles", route: "/images/tools/hair-changer" },
  { id: "avatar-maker", name: "Avatar Maker 3D", desc: "3D avatars", route: "/images/tools/avatar-maker" },
];

const GRADIENTS = [
  "from-emerald-600/80 to-emerald-900/90", "from-rose-600/80 to-rose-900/90",
  "from-violet-600/80 to-violet-900/90", "from-amber-600/80 to-amber-900/90",
  "from-cyan-600/80 to-cyan-900/90", "from-pink-600/80 to-pink-900/90",
  "from-indigo-600/80 to-indigo-900/90", "from-teal-600/80 to-teal-900/90",
];

const IMAGE_PLACEHOLDERS = [
  "Turn your ideas into art...",
  "A futuristic city at sunset...",
  "Create stunning portraits...",
  "Anime girl in a garden...",
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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <button onClick={() => setPreviewImg(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-foreground flex-1">Preview</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border/20">
              <img src={previewImg.url} alt="" className="w-full object-contain" />
            </div>
            <div className="flex gap-3">
              <a href={previewImg.url} download className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">
                <Download className="w-4 h-4" /> Download
              </a>
              {previewImg.prompt && (
                <button onClick={() => { navigate("/images/studio", { state: { prompt: previewImg.prompt } }); setPreviewImg(null); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">
                  <RefreshCw className="w-4 h-4" /> Reuse
                </button>
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
            <h1 className="text-base font-bold text-foreground">Images</h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {activeTab === "home" && (
            <div className="pt-3 space-y-4">
              <UnifiedInputBar
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                onAttach={() => fileInputRef.current?.click()}
                onModelPick={() => setModelPickerOpen(true)}
                modelIcon={selectedModel.iconUrl}
                showModelPicker
                placeholders={IMAGE_PLACEHOLDERS}
                attachedImage={attachedImage}
                onClearAttachment={() => setAttachedImage(null)}
              />

              <ToolCardGrid tools={ALL_TOOLS} gradients={GRADIENTS} type="image" />

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/images/studio")} className="w-full rounded-2xl overflow-hidden relative h-32 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 flex items-center">
                <div className="flex-1 text-left px-5">
                  <p className="text-lg font-bold text-foreground whitespace-nowrap">Create Your Image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Generate images with AI</p>
                </div>
                <div className="w-32 h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Wand2 className="w-10 h-10 text-primary/40" />
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/images/agent")} className="w-full rounded-2xl overflow-hidden relative h-32 bg-gradient-to-r from-accent/30 to-accent/5 border border-border/20 flex items-center">
                <div className="flex-1 text-left px-5">
                  <p className="text-lg font-bold text-foreground whitespace-nowrap">Edit Your Image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Transform existing images</p>
                </div>
                <div className="w-32 h-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center">
                  <ImagePlus className="w-10 h-10 text-muted-foreground/30" />
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
