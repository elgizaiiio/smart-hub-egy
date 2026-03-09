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

  // ── Mobile Layout ──
  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={handleNewChat} activeConversationId={conversationId}>
      <div className="h-full flex bg-background">
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

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
            <button onClick={() => setSidebarOpen(true)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            {capability.acceptsImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            )}

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Describe the video..."
                rows={1}
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 py-2 max-h-20"
                style={{ minHeight: "36px" }}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={(!input.trim() && attachedImages.length === 0) || isGenerating}
              className="shrink-0 h-10 px-5 flex items-center gap-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <div className="flex items-center gap-1 pl-2 border-l border-primary-foreground/20">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-xs">{creditCost}</span>
              </div>
            </button>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-border">
            <button
              onClick={() => navigate("/images")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Video className="w-3.5 h-3.5" />
              Video
            </button>
          </div>

          {/* Attached images */}
          {attachedImages.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
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
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isGenerating && generatedVideos.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <ThinkingLoader />
              </div>
            )}

            {!isGenerating && generatedVideos.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-24 h-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5"
                >
                  <Video className="w-12 h-12 text-primary/30" />
                </motion.div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">AI Video Creation</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Describe what you want to see and let AI create a stunning video
                </p>
              </div>
            )}

            {generatedVideos.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 py-4">
                {isGenerating && (
                  <div className="mb-6">
                    <ThinkingLoader />
                  </div>
                )}
                <div className="columns-1 gap-3">
                  {generatedVideos.map((vid) => (
                    <motion.div
                      key={vid.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden"
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
          </div>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />
      </div>
    </AppLayout>
  );
};

export default VideosPage;
