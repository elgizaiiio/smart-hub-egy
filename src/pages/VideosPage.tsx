import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Send, SlidersHorizontal, Wand2, X, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import { VIDEO_TOOLS } from "@/lib/videoToolsData";
import { useDynamicModels } from "@/hooks/useModels";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

type Tab = "home" | "studio" | "community";
const FALLBACK_ICON = "/model-logos/megsy.png";

const VideosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>((location.state as any)?.tab || "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioVideos, setStudioVideos] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string; iconUrl: string } | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { models: dynamicModels } = useDynamicModels();

  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("5s");
  const [quality, setQuality] = useState("standard");

  useEffect(() => {
    if (activeTab === "studio") loadStudioVideos();
    if (activeTab === "community") loadCommunity();
  }, [activeTab]);

  useEffect(() => {
    const s = (location.state as any)?.tab;
    if (s === "studio") setActiveTab("studio");
  }, [location.state]);

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

  const videoModels = dynamicModels
    .filter(m => ["video", "video-i2v", "video-avatar", "video-effect", "video-motion"].includes(m.type))
    .map(m => ({ id: m.id, name: m.name, cost: Number(m.credits) || 1, iconUrl: m.iconUrl || "", badge: (Number(m.credits) >= 3 ? "PRO" : m.badges?.includes("NEW") ? "NEW" : undefined) as "NEW" | "PRO" | undefined }));

  const currentIcon = selectedModel?.iconUrl || FALLBACK_ICON;

  const handleModelSelect = (model: typeof videoModels[0]) => {
    setSelectedModel({ id: model.id, name: model.name, iconUrl: model.iconUrl });
    setModelPickerOpen(false);
  };

  const handleSend = () => {
    if (!prompt.trim()) return;
    navigate("/videos/studio", { state: { prompt: prompt.trim(), selectedModelId: selectedModel?.id, settings: { aspectRatio, duration, quality } } });
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-prompt", { body: { prompt: prompt.trim(), type: "video" } });
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

  const allTools = [
    ...VIDEO_TOOLS,
    { id: "video-to-text", name: "Video to Text", description: "Transcribe video/audio to text", model: "fal-ai/whisper", costType: "per-minute" as const, baseCost: 1, inputType: "video" as const, route: "/videos/tools/video-to-text", badge: "NEW" as const, pricingDetails: "1 MC/min" },
  ];

  const TABS: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "studio", label: "Studio" },
    { id: "community", label: "Community" },
  ];

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} currentMode="videos" />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Videos</h1>
            <div className="w-9" />
          </div>
          {/* Pill tabs */}
          <div className="flex gap-1.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-36">
          {activeTab === "home" && (
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                {allTools.map(tool => (
                  <motion.button
                    key={tool.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(tool.route)}
                    className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left relative group"
                  >
                    {tool.previewVideo ? (
                      <video src={tool.previewVideo} autoPlay loop muted playsInline className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-muted-foreground/20 text-xs">Preview</div>
                    )}
                    {tool.badge && (
                      <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        tool.badge === "NEW" ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"
                      }`}>{tool.badge}</span>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                      <span className="text-xs text-muted-foreground">{tool.pricingDetails || `${tool.baseCost} MC`}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "studio" && (
            <div className="pt-4">
              {studioVideos.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No videos generated yet</p>
                  <button onClick={() => setActiveTab("home")} className="mt-3 text-sm text-primary font-medium">Start creating</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studioVideos.map((vid, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/20">
                      <video src={vid.url} controls className="w-full" />
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
                    <div key={item.id} className="rounded-2xl overflow-hidden bg-card border border-border/20">
                      <video src={item.media_url} autoPlay muted loop playsInline className="w-full" />
                      <div className="p-2.5 flex gap-1.5">
                        <button
                          onClick={() => { navigator.clipboard.writeText(item.prompt || ""); toast.success("Copied"); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium bg-accent/60 text-foreground hover:bg-accent transition-colors"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <button
                          onClick={() => { setPrompt(item.prompt || ""); setActiveTab("home"); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
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
          <div className="max-w-3xl mx-auto relative pointer-events-auto">
            <AnimatePresence>
              {modelPickerOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/30" onClick={() => setModelPickerOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/30 rounded-2xl p-3 max-h-80 overflow-y-auto shadow-2xl">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 px-1">Video Models</p>
                    <div className="space-y-0.5">
                      {videoModels.map(model => (
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

            <AnimatePresence>
              {settingsOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/30" onClick={() => setSettingsOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-foreground">Generation Settings</p>
                      <button onClick={() => setSettingsOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Aspect Ratio</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["16:9", "9:16", "1:1", "4:3"].map(r => (
                            <button key={r} onClick={() => setAspectRatio(r)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${aspectRatio === r ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Duration</p>
                        <div className="flex gap-1.5">
                          {["5s", "10s", "15s"].map(d => (
                            <button key={d} onClick={() => setDuration(d)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${duration === d ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"}`}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Quality</p>
                        <div className="flex gap-1.5">
                          {["standard", "hd"].map(q => (
                            <button key={q} onClick={() => setQuality(q)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${quality === q ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"}`}>{q}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 rounded-2xl border border-border/30 bg-background/90 backdrop-blur-xl px-3 py-3 shadow-lg">
              <button onClick={() => { setModelPickerOpen(!modelPickerOpen); setSettingsOpen(false); }} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent/50 transition-colors" title={selectedModel?.name || "Select model"}>
                <img src={currentIcon} alt="" className="w-7 h-7 rounded-lg object-contain" />
              </button>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Describe your video..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-2.5 max-h-[150px]"
                style={{ minHeight: "44px" }}
              />
              <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || enhancing} className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 ${enhancing ? "animate-spin" : ""}`} title="Enhance prompt">
                <Sparkles className="w-4 h-4" />
              </button>
              <button onClick={() => { setSettingsOpen(!settingsOpen); setModelPickerOpen(false); }} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={handleSend} disabled={!prompt.trim()} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-all">
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
