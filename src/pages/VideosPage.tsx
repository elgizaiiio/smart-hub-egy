import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Download, Loader2, Settings2, Video, Image as ImageIcon, X, Trash2, ArrowUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import AppLayout from "@/layouts/AppLayout";
import AppSidebar from "@/components/AppSidebar";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import ModelPickerSheet from "@/components/ModelPickerSheet";
import ThinkingLoader from "@/components/ThinkingLoader";
import ShowcaseGrid from "@/components/ShowcaseGrid";
import ShowcaseDetailModal from "@/components/ShowcaseDetailModal";
import VideoBottomInputBar, { DEFAULT_VIDEO_SETTINGS, type VideoSettings } from "@/components/VideoBottomInputBar";
import VideoSettingsDrawer from "@/components/VideoSettingsDrawer";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";
import { getVideoModelCapability } from "@/lib/videoModelCapabilities";

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  modelId: string;
  duration: string;
  createdAt: Date;
}

interface AttachedImage {
  id: string;
  dataUrl: string;
  mimeType: string;
  name: string;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const VideosPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userId, credits, hasEnoughCredits, refreshCredits } = useCredits();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("videos"));
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedShowcaseItem, setSelectedShowcaseItem] = useState<ShowcaseItem | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capability = useMemo(() => getVideoModelCapability(selectedModel.id), [selectedModel.id]);
  const creditCost = Number(selectedModel.credits) || 1;

  useEffect(() => {
    if (!capability.acceptsImages && attachedImages.length > 0) {
      setAttachedImages([]);
      toast.info(`${selectedModel.name} works with text only.`);
    }
    if (capability.acceptsImages && attachedImages.length > capability.maxImages) {
      setAttachedImages((prev) => prev.slice(0, capability.maxImages));
    }
  }, [capability, selectedModel.name, attachedImages.length]);

  const createOrGetConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) || "Video Generation";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "videos", model: selectedModel.id, user_id: user.id } as any)
      .select("id")
      .single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  };

  const saveMessage = async (convId: string, role: string, content: string, images?: string[]) => {
    await supabase.from("messages").insert({
      conversation_id: convId,
      role,
      content,
      images: images || null,
    });
  };

  const handleGenerate = async () => {
    const trimmed = input.trim();
    if (!trimmed && attachedImages.length === 0) return;

    if (capability.requiresImage && attachedImages.length === 0) {
      toast.error(`${selectedModel.name} requires at least one image.`);
      return;
    }

    if (userId && !hasEnoughCredits(creditCost)) {
      toast.error("Insufficient MC credits. Please top up.");
      return;
    }

    const userContent = trimmed || `Generate with ${selectedModel.name}`;
    setInput("");
    setIsGenerating(true);
    setShowResults(true);

    const convId = await createOrGetConversation(userContent);
    if (convId) await saveMessage(convId, "user", userContent);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: userContent,
          model: selectedModel.id,
          image_url: attachedImages[0]?.dataUrl || undefined,
          user_id: userId,
          credits_cost: creditCost,
        }),
      });

      const data = await resp.json();

      if (data.error) {
        toast.error(data.error);
        if (convId) await saveMessage(convId, "assistant", `Error: ${data.error}`);
      } else if (data.video_url) {
        const newVideo: GeneratedVideo = {
          id: crypto.randomUUID(),
          url: data.video_url,
          prompt: userContent,
          model: selectedModel.name,
          modelId: selectedModel.id,
          duration: `${settings.duration}s`,
          createdAt: new Date(),
        };
        setGeneratedVideos((prev) => [newVideo, ...prev]);
        if (convId) await saveMessage(convId, "assistant", userContent, [data.video_url]);
      } else {
        toast.error("No video was returned. Please try again.");
      }
    } catch {
      toast.error("Generation failed. Please try again.");
    }

    setIsGenerating(false);
    setAttachedImages([]);
    refreshCredits();

    if (convId) {
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!capability.acceptsImages) {
      toast.error(`${selectedModel.name} doesn't accept image inputs.`);
      e.target.value = "";
      return;
    }
    const remainingSlots = Math.max(capability.maxImages - attachedImages.length, 0);
    if (remainingSlots === 0) {
      toast.error(`Max ${capability.maxImages} images allowed.`);
      e.target.value = "";
      return;
    }
    const filesToUse = files.slice(0, remainingSlots);
    try {
      const loaded = await Promise.all(
        filesToUse.map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await readFileAsDataUrl(file),
          mimeType: file.type || "image/jpeg",
          name: file.name,
        })),
      );
      setAttachedImages((prev) => [...prev, ...loaded]);
    } catch {
      toast.error("Failed to read attached image");
    }
    e.target.value = "";
  };

  const handleNewChat = () => {
    setGeneratedVideos([]);
    setConversationId(null);
    setInput("");
    setAttachedImages([]);
    setShowResults(false);
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    setShowResults(true);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (msgs) {
      const videos: GeneratedVideo[] = [];
      msgs.forEach((m) => {
        if (m.role === "assistant" && m.images) {
          m.images.forEach((url: string) => {
            videos.push({
              id: crypto.randomUUID(),
              url,
              prompt: m.content,
              model: selectedModel.name,
              modelId: selectedModel.id,
              duration: "5s",
              createdAt: new Date(m.created_at),
            });
          });
        }
      });
      setGeneratedVideos(videos.reverse());
    }
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.mp4`;
    a.target = "_blank";
    a.click();
  };

  const handleRecreate = (item: ShowcaseItem) => {
    setInput(item.prompt);
    setSelectedShowcaseItem(null);
  };

  // ── Desktop Layout ──
  if (!isMobile) {
    return (
      <AppLayout onSelectConversation={loadConversation} onNewChat={handleNewChat} activeConversationId={conversationId}>
        <div className="h-full flex bg-background relative">
          <ModelPickerSheet
            open={modelPickerOpen}
            onClose={() => setModelPickerOpen(false)}
            onSelect={(m) => { setSelectedModel(m); setModelPickerOpen(false); }}
            mode="videos"
            selectedModelId={selectedModel.id}
          />

          <ShowcaseDetailModal
            item={selectedShowcaseItem}
            onClose={() => setSelectedShowcaseItem(null)}
            onRecreate={handleRecreate}
          />

          {/* Results overlay */}
          <AnimatePresence>
            {showResults && generatedVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-background overflow-y-auto"
              >
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  <button
                    onClick={() => setShowResults(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm font-bold text-foreground">Generated Videos</h2>
                  <span className="text-xs text-muted-foreground">{generatedVideos.length} videos</span>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-6">
                  {isGenerating && (
                    <div className="mb-6">
                      <ThinkingLoader />
                    </div>
                  )}
                  <div className="columns-1 lg:columns-2 xl:columns-3 gap-4">
                    {generatedVideos.map((vid) => (
                      <motion.div
                        key={vid.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="break-inside-avoid mb-4 group relative rounded-2xl overflow-hidden"
                      >
                        <video
                          src={vid.url}
                          controls
                          className="w-full rounded-2xl object-cover pointer-events-auto"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3 pointer-events-none group-hover:pointer-events-auto">
                          <div className="flex-1">
                            <p className="text-white text-xs line-clamp-2 mb-1">{vid.prompt}</p>
                            <div className="flex gap-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">{vid.model}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">{vid.duration}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDownload(vid.url, vid.prompt)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setGeneratedVideos((prev) => prev.filter((g) => g.id !== vid.id))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main: Showcase gallery */}
          <div className="flex-1 overflow-y-auto pb-32">
            <ShowcaseGrid onItemClick={setSelectedShowcaseItem} />

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-24 h-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5"
              >
                <Video className="w-12 h-12 text-primary/30" />
              </motion.div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">AI Video Creation</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Describe what you want to see and let AI bring your vision to life as video
              </p>
            </div>
          </div>

          {/* Bottom input bar */}
          <VideoBottomInputBar
            input={input}
            onInputChange={setInput}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            settings={settings}
            onSettingsChange={setSettings}
            creditCost={creditCost}
            canAttach={capability.acceptsImages}
            onAttach={() => fileInputRef.current?.click()}
            attachedImages={attachedImages}
            onRemoveAttached={(id) => setAttachedImages((prev) => prev.filter((i) => i.id !== id))}
          />

          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />
        </div>
      </AppLayout>
    );
  }

  // ── Mobile Layout (Artlist-style) ──

  const MODEL_LOGOS: Record<string, string> = {
    "megsy-video": "/model-logos/megsy.png",
    "veo-3.1": "/model-logos/google.ico",
    "veo-3.1-fast": "/model-logos/google.ico",
    "kling-3-pro": "/model-logos/kling.png",
    "kling-o1": "/model-logos/kling.png",
    "openai-sora": "/model-logos/openai.svg",
    "pika-2.2": "/model-logos/pika.png",
    "luma-dream": "/model-logos/luma.png",
    "seedance-pro": "/model-logos/bytedance.ico",
    "wan-2.6": "/model-logos/fal.ico",
    "pixverse-5.5": "/model-logos/fal.ico",
    "megsy-video-i2v": "/model-logos/megsy.png",
  };

  const currentLogo = MODEL_LOGOS[selectedModel.id];

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={handleNewChat} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background relative">
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="videos"
        />

        <ModelPickerSheet
          open={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          onSelect={(m) => { setSelectedModel(m); setModelPickerOpen(false); }}
          mode="videos"
          selectedModelId={selectedModel.id}
        />

        <VideoSettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingsChange={setSettings}
          selectedModel={selectedModel}
          onOpenModelPicker={() => setModelPickerOpen(true)}
        />

        {/* Showcase / content area */}
        <div className="flex-1 overflow-y-auto pb-48">
          {/* Top bar - minimal */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Generated videos */}
          {generatedVideos.length > 0 && (
            <div className="px-2 py-2">
              {isGenerating && (
                <div className="mb-4 flex justify-center">
                  <ThinkingLoader />
                </div>
              )}
              <div className="columns-2 gap-2">
                {generatedVideos.map((vid) => (
                  <motion.div
                    key={vid.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="break-inside-avoid mb-2 group relative rounded-2xl overflow-hidden"
                  >
                    <video
                      src={vid.url}
                      controls
                      className="w-full rounded-2xl object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-end p-2 pointer-events-none group-hover:pointer-events-auto">
                      <div className="flex gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white">{vid.model}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(vid.url, vid.prompt)}
                        className="ml-auto w-6 h-6 flex items-center justify-center rounded-md bg-white/20 text-white"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Showcase grid when no videos */}
          {generatedVideos.length === 0 && !isGenerating && (
            <ShowcaseGrid onItemClick={setSelectedShowcaseItem} />
          )}

          {isGenerating && generatedVideos.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <ThinkingLoader />
            </div>
          )}
        </div>

        {/* ── Bottom Artlist-style input bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-30" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="mx-3">
            {/* Attached images */}
            <AnimatePresence>
              {attachedImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 px-3 pb-2"
                >
                  {attachedImages.map((img) => (
                    <div key={img.id} className="relative shrink-0">
                      <img src={img.dataUrl} alt={img.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                      <button
                        onClick={() => setAttachedImages((prev) => prev.filter((i) => i.id !== img.id))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-muted/80 backdrop-blur-3xl border border-border rounded-2xl shadow-lg">
              {/* Top chips row */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">

                {/* Settings chip */}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>{selectedModel.name}</span>
                </button>
              </div>

              {/* Text input */}
              <div className="px-4 py-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the video you want to create"
                  rows={1}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-foreground/30 max-h-20"
                  style={{ minHeight: "32px" }}
                />
              </div>

              {/* Bottom icons row */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  {/* Attach image */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/60 border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Send button */}
                <button
                  onClick={handleGenerate}
                  disabled={(!input.trim() && attachedImages.length === 0) || isGenerating}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-muted border border-border text-foreground disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ShowcaseDetailModal
          item={selectedShowcaseItem}
          onClose={() => setSelectedShowcaseItem(null)}
          onRecreate={handleRecreate}
        />

        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />
      </div>
    </AppLayout>
  );
};

export default VideosPage;
