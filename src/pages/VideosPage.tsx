import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Download, RefreshCw, ArrowLeft, Wand2, Compass, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { VIDEO_TOOLS } from "@/lib/videoToolsData";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import type { ModelOption } from "@/components/ModelSelector";
import UnifiedInputBar from "@/components/UnifiedInputBar";
import createVideoCard from "@/assets/create-video-card.jpg";
import editVideoCard from "@/assets/edit-video-hero.jpg";

type Tab = "home" | "studio" | "community";

const NANO_BANANA_DEFAULT: ModelOption = {
  id: "nano-banana",
  name: "Nano Banana",
  credits: "1",
  iconUrl: "/model-logos/nano-banana.jpg",
};

const ALL_TOOLS = [
  { id: "swap-characters", name: "Swap Characters", route: "/videos/tools/swap-characters" },
  { id: "talking-photo", name: "Talking Photo", route: "/videos/tools/talking-photo" },
  { id: "upscale", name: "Video Upscale", route: "/videos/tools/upscale" },
  { id: "auto-caption", name: "Auto Caption", route: "/videos/tools/auto-caption" },
  { id: "lip-sync", name: "Lip Sync", route: "/videos/tools/lip-sync" },
  { id: "video-extender", name: "Video Extender", route: "/videos/tools/video-extender" },
];

const TOOL_ROWS = [
  ALL_TOOLS.slice(0, Math.ceil(ALL_TOOLS.length / 2)),
  ALL_TOOLS.slice(Math.ceil(ALL_TOOLS.length / 2)),
];

const TOOL_CARDS: { id: string; colors: string; accent1: string; accent2: string }[] = [
  { id: "swap-characters", colors: "from-violet-400 via-purple-500 to-violet-700", accent1: "rgba(180,130,255,0.4)", accent2: "rgba(100,40,180,0.3)" },
  { id: "talking-photo", colors: "from-rose-400 via-pink-500 to-rose-700", accent1: "rgba(255,130,170,0.4)", accent2: "rgba(180,40,90,0.3)" },
  { id: "upscale", colors: "from-cyan-400 via-blue-500 to-cyan-700", accent1: "rgba(80,200,255,0.4)", accent2: "rgba(20,100,180,0.3)" },
  { id: "auto-caption", colors: "from-amber-400 via-orange-500 to-amber-700", accent1: "rgba(255,190,80,0.4)", accent2: "rgba(200,100,20,0.3)" },
  { id: "lip-sync", colors: "from-emerald-400 via-teal-500 to-emerald-700", accent1: "rgba(80,220,160,0.4)", accent2: "rgba(20,130,80,0.3)" },
  { id: "video-extender", colors: "from-indigo-400 via-blue-500 to-indigo-700", accent1: "rgba(120,130,255,0.4)", accent2: "rgba(50,40,180,0.3)" },
];
const TOOL_CARD_MAP = Object.fromEntries(TOOL_CARDS.map(c => [c.id, c]));

const VIDEO_PLACEHOLDERS = [
  "A cinematic drone shot over mountains...",
  "A cat playing piano in slow motion...",
  "Create your next viral video...",
  "Anime fight scene with epic effects...",
];

const HERO_TEXTS = [
  { main: "Bring stories to", accent: "life" },
  { main: "Your ideas", accent: "in motion" },
  { main: "AI-powered", accent: "video creation" },
  { main: "Dream it", accent: "film it" },
];

const VideosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>((location.state as any)?.tab || "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioVideos, setStudioVideos] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [previewVid, setPreviewVid] = useState<{ url: string; prompt?: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(NANO_BANANA_DEFAULT);
  const [toolLandingImages, setToolLandingImages] = useState<Record<string, string>>({});
  const [heroIdx, setHeroIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "studio") loadStudioVideos();
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

  const loadStudioVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "videos");
    if (!convs || convs.length === 0) { setStudioVideos([]); return; }
    const convIds = convs.map(c => c.id);
    const { data } = await supabase.from("messages").select("content, images, created_at").eq("role", "assistant").not("images", "is", null).in("conversation_id", convIds).order("created_at", { ascending: false }).limit(50);
    if (data) {
      const vids = data.flatMap(m => (m.images || []).filter((u: string) => u.includes(".mp4") || u.includes("video")).map((url: string) => ({ url, prompt: m.content?.slice(0, 200) || "", created_at: m.created_at })));
      setStudioVideos(vids);
    }
  };

  const loadCommunity = async () => {
    const { data } = await supabase.from("showcase_items").select("*").eq("media_type", "video").order("display_order", { ascending: true }).limit(50);
    if (data) setCommunityItems(data as any);
  };

  const loadToolLandingImages = async () => {
    const cached = localStorage.getItem("megsy_tool_images_vid");
    if (cached) {
      try { setToolLandingImages(JSON.parse(cached)); } catch {}
    }
    const { data } = await supabase.from("tool_landing_images").select("tool_id, image_url").in("tool_id", ALL_TOOLS.map(t => t.id));
    if (!data) return;
    const map = data.reduce<Record<string, string>>((acc, item) => { if (item.image_url) acc[item.tool_id] = item.image_url; return acc; }, {});
    setToolLandingImages(map);
    localStorage.setItem("megsy_tool_images_vid", JSON.stringify(map));
  };

  const getToolPreview = (toolId: string) => {
    if (toolLandingImages[toolId]) return toolLandingImages[toolId];
    const tool = VIDEO_TOOLS.find(t => t.id === toolId);
    return tool?.previewVideo || "";
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    navigate("/videos/studio", { state: { prompt: prompt.trim(), model: selectedModel } });
  };

  if (previewVid) {
    return (
      <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
        <div className="h-full flex flex-col bg-background">
          <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3 border-b border-border/30">
            <button onClick={() => setPreviewVid(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground flex-1">Preview</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border/20"><video src={previewVid.url} controls autoPlay className="w-full" /></div>
            <div className="flex gap-3">
              <a href={previewVid.url} download className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm"><Download className="w-4 h-4" /> Download</a>
              {previewVid.prompt && (
                <button onClick={() => { navigate("/videos/studio", { state: { prompt: previewVid.prompt } }); setPreviewVid(null); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm"><RefreshCw className="w-4 h-4" /> Reuse</button>
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
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="videos" />
        <ModelPickerSheet open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} onSelect={m => { setSelectedModel(m); setModelPickerOpen(false); }} mode="videos" selectedModelId={selectedModel.id} />

        <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <div className="w-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {activeTab === "home" && (
            <div className="pt-2 space-y-5">
              <div className="text-center py-3">
                <AnimatePresence mode="wait">
                  <motion.div key={heroIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
                    <p className="text-2xl font-extrabold text-foreground leading-tight">{HERO_TEXTS[heroIdx].main}</p>
                    <p className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-tight">{HERO_TEXTS[heroIdx].accent}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <UnifiedInputBar
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                onAttach={() => fileInputRef.current?.click()}
                onModelPick={() => setModelPickerOpen(true)}
                modelIcon={selectedModel.iconUrl}
                modelName={selectedModel.name}
                showModelPicker
                placeholders={VIDEO_PLACEHOLDERS}
                className="min-h-[72px]"
              />

              <div className="space-y-3">
                {TOOL_ROWS.map((row, rowIndex) => (
                  <div key={rowIndex} className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                    <div className="flex min-w-max gap-3">
                      {row.map((tool) => {
                        const card = TOOL_CARD_MAP[tool.id];
                        const colors = card?.colors || "from-gray-400 via-gray-500 to-gray-700";
                        const a1 = card?.accent1 || "rgba(150,150,150,0.4)";
                        const a2 = card?.accent2 || "rgba(80,80,80,0.3)";
                        return (
                          <motion.button key={tool.id} whileTap={{ scale: 0.96 }} onClick={() => navigate(tool.route)} className={`relative h-56 w-44 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${colors}`}>
                            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 120% 80% at 20% 30%, ${a1}, transparent), radial-gradient(ellipse 100% 60% at 80% 70%, ${a2}, transparent), radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.08), transparent)` }} />
                            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 80%, rgba(255,255,255,0.12), transparent 50%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.1), transparent 40%)` }} />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <p className="text-[11px] uppercase tracking-[0.2em] font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent text-center leading-relaxed drop-shadow-sm">{tool.name}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/videos/studio")} className="relative flex h-32 w-full items-center overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/20 to-primary/5">
                <div className="absolute inset-y-0 right-0 w-[42%] overflow-hidden">
                  <img src={createVideoCard} alt="Create" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-l from-background/10 via-background/20 to-transparent" />
                </div>
                <div className="relative flex-1 px-5 pr-[38%] text-left">
                  <p className="text-lg font-bold text-foreground">Create Your Video</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Generate videos with AI</p>
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/videos/studio")} className="relative flex h-32 w-full items-center overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-r from-accent/30 to-accent/5">
                <div className="absolute inset-y-0 right-0 w-[42%] overflow-hidden">
                  <img src={editVideoCard} alt="Edit" className="h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-l from-background/10 via-background/20 to-transparent" />
                </div>
                <div className="relative flex-1 px-5 pr-[38%] text-left">
                  <p className="text-lg font-bold text-foreground">Edit Your Video</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Transform existing videos</p>
                </div>
              </motion.button>
            </div>
          )}

          {activeTab === "studio" && (
            <div className="pt-4">
              {studioVideos.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No videos generated yet</p>
                  <button onClick={() => navigate("/videos/studio")} className="mt-3 text-sm text-primary font-medium">Start creating</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studioVideos.map((vid, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/20 cursor-pointer" onClick={() => setPreviewVid(vid)}>
                      <video src={vid.url} className="w-full" muted playsInline />
                    </div>
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
                <div className="space-y-3">
                  {communityItems.map(item => (
                    <div key={item.id} className="rounded-2xl overflow-hidden bg-card border border-border/20 cursor-pointer" onClick={() => setPreviewVid({ url: item.media_url, prompt: item.prompt })}>
                      <video src={item.media_url} autoPlay muted loop playsInline className="w-full" />
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

        <input ref={fileInputRef} type="file" className="hidden" accept="video/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setAttachedVideo(reader.result as string);
            reader.readAsDataURL(file);
          }
          e.target.value = "";
        }} />
      </div>
    </AppLayout>
  );
};

export default VideosPage;
