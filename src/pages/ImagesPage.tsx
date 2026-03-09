import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Paperclip, Sparkles, Download, Loader2, Settings2, Image as ImageIcon, Video, MoreHorizontal, Trash2, Coins, Zap, ChevronLeft } from "lucide-react";
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
import ImageSettingsPanel, { MobileSettingsDrawer, DEFAULT_SETTINGS, type ImageSettings, type ImageStyle } from "@/components/ImageSettingsPanel";
import {
  getImageModelCapability,
} from "@/lib/imageModelCapabilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PLACEHOLDERS = [
  "A cyberpunk cityscape at sunset...",
  "Oil painting of a serene lake...",
  "Professional product photo...",
  "Anime character with flowing hair...",
  "Minimalist logo design...",
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  modelId: string;
  dimensions: string;
  createdAt: Date;
  style?: string;
  speed?: string;
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
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

const STYLE_SUFFIX: Record<ImageStyle, string> = {
  none: "",
  cinematic: ", cinematic lighting, dramatic shadows, film grain, movie still",
  creative: ", creative art style, imaginative composition, artistic",
  dynamic: ", dynamic composition, energetic, motion blur, dramatic angles",
  fashion: ", fashion photography, editorial style, studio lighting, vogue",
  portrait: ", portrait photography, shallow depth of field, bokeh, studio lighting",
  "stock-photo": ", professional stock photography, clean composition, commercial",
  vibrant: ", vibrant colors, saturated, colorful, high contrast",
  anime: ", anime style, manga art, Japanese animation, cel shading",
  "3d-render": ", 3D render, Octane render, Blender, CGI, volumetric lighting",
};

// Group images by day
const groupByDay = (images: GeneratedImage[]) => {
  const groups: { label: string; images: GeneratedImage[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const grouped: Record<string, GeneratedImage[]> = {};
  images.forEach(img => {
    const d = new Date(img.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let label: string;
    if (day.getTime() === today.getTime()) label = "Today";
    else if (day.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(img);
  });

  Object.entries(grouped).forEach(([label, imgs]) => {
    groups.push({ label, images: imgs });
  });

  return groups;
};

const ImagesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userId, credits, hasEnoughCredits, refreshCredits } = useCredits();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("images"));
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [settings, setSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capability = useMemo(() => getImageModelCapability(selectedModel.id), [selectedModel.id]);
  const creditCost = (Number(selectedModel.credits) || 1) * settings.numImages;

  // Animated placeholder
  useEffect(() => {
    if (input) return;
    const target = PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (i < target.length) {
        setDisplayedPlaceholder(target.slice(0, i + 1));
        i += 1;
      } else {
        clearInterval(t);
        setTimeout(() => setPlaceholderIdx((p) => (p + 1) % PLACEHOLDERS.length), 2500);
      }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx, input]);

  // Clear images when model doesn't support them
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
    const title = firstMessage.slice(0, 50) || "Image Generation";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "images", model: selectedModel.id, user_id: user.id } as any)
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

    const styleSuffix = STYLE_SUFFIX[settings.style] || "";
    const finalPrompt = (trimmed || `Generate with ${selectedModel.name}`) + styleSuffix;

    setInput("");
    setIsGenerating(true);

    const convId = await createOrGetConversation(trimmed || "Image Generation");
    if (convId) await saveMessage(convId, "user", trimmed);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: selectedModel.id,
          image_url: attachedImages[0]?.dataUrl,
          image_urls: attachedImages.map((img) => img.dataUrl),
          user_id: userId,
          credits_cost: creditCost,
          num_images: settings.numImages,
          image_size: { width: settings.dimensions.width, height: settings.dimensions.height },
        }),
      });

      const data = await resp.json();

      if (data.error) {
        toast.error(data.error);
        if (convId) await saveMessage(convId, "assistant", `Error: ${data.error}`);
      } else {
        const urls: string[] = data.image_urls || (data.image_url ? [data.image_url] : []);
        const newImages: GeneratedImage[] = urls.map((url) => ({
          id: crypto.randomUUID(),
          url,
          prompt: trimmed || "Generated image",
          model: selectedModel.name,
          modelId: selectedModel.id,
          dimensions: `${settings.dimensions.width}×${settings.dimensions.height}`,
          createdAt: new Date(),
          style: settings.style !== "none" ? settings.style : undefined,
          speed: "Fast",
        }));
        setGeneratedImages((prev) => [...newImages, ...prev]);
        if (convId) await saveMessage(convId, "assistant", trimmed, urls);
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
    setGeneratedImages([]);
    setConversationId(null);
    setInput("");
    setAttachedImages([]);
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (msgs) {
      const images: GeneratedImage[] = [];
      msgs.forEach((m) => {
        if (m.role === "assistant" && m.images) {
          m.images.forEach((url: string) => {
            images.push({
              id: crypto.randomUUID(),
              url,
              prompt: m.content,
              model: selectedModel.name,
              modelId: selectedModel.id,
              dimensions: "1024×1024",
              createdAt: new Date(m.created_at),
              speed: "Fast",
            });
          });
        }
      });
      setGeneratedImages(images.reverse());
    }
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.png`;
    a.target = "_blank";
    a.click();
  };

  const dayGroups = useMemo(() => groupByDay(generatedImages), [generatedImages]);

  const settingsPanelContent = (
    <ImageSettingsPanel
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      onOpenModelPicker={() => { setSettingsOpen(false); setModelPickerOpen(true); }}
      settings={settings}
      onSettingsChange={setSettings}
    />
  );

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={handleNewChat} activeConversationId={conversationId}>
      <div className="h-full flex bg-background">
        {/* Mobile Sidebar */}
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="images"
        />

        {/* Model Picker Sheet */}
        <ModelPickerSheet
          open={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          onSelect={(m) => { setSelectedModel(m); setModelPickerOpen(false); }}
          mode="images"
          selectedModelId={selectedModel.id}
        />

        {/* ── Desktop Left Settings Panel ── */}
        {!isMobile && (
          <div className="w-[260px] shrink-0 border-r border-border bg-card flex flex-col hidden md:flex">
            {/* Top bar */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border space-y-3">
              <h2 className="text-sm font-bold text-foreground">Image Generation</h2>
              <div className="flex bg-secondary rounded-lg p-1">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold bg-background text-foreground shadow-sm">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image
                </button>
                <button
                  onClick={() => navigate("/videos")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  Video
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {settingsPanelContent}
            </div>
          </div>
        )}

        {/* Mobile Settings Drawer */}
        {isMobile && (
          <MobileSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)}>
            {settingsPanelContent}
          </MobileSettingsDrawer>
        )}

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Top Bar: Prompt + Generate ── */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Attach button */}
            {capability.acceptsImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            )}

            {/* Prompt input */}
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
                placeholder={displayedPlaceholder}
                rows={1}
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 py-2 max-h-20"
                style={{ minHeight: "36px" }}
              />
            </div>

            {isMobile && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            )}

            {/* Generate Button - Leonardo style */}
            <button
              onClick={handleGenerate}
              disabled={(!input.trim() && attachedImages.length === 0) || isGenerating}
              className="shrink-0 h-10 px-5 flex items-center gap-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Generate</span>
              <div className="flex items-center gap-1 pl-2 border-l border-primary-foreground/20">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-xs">{creditCost}</span>
              </div>
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-border">
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <ImageIcon className="w-3.5 h-3.5" />
              Image
            </button>
            <button
              onClick={() => navigate("/videos")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Video
            </button>
          </div>

          {/* ── Attached images preview ── */}
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

          {/* ── Generated Images - Leonardo Layout ── */}
          <div className="flex-1 overflow-y-auto">
            {isGenerating && generatedImages.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <ThinkingLoader />
              </div>
            )}

            {!isGenerating && generatedImages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-24 h-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5"
                >
                  <ImageIcon className="w-12 h-12 text-primary/30" />
                </motion.div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">AI Creation</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Describe what you want to see and let AI bring your vision to life
                </p>
              </div>
            )}

            {dayGroups.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 py-4">
                {isGenerating && (
                  <div className="mb-6">
                    <ThinkingLoader />
                  </div>
                )}

                {dayGroups.map((group) => (
                  <div key={group.label} className="mb-8">
                    <h3 className="text-sm font-semibold text-foreground mb-4">{group.label}</h3>

                    <div className="space-y-6">
                      {group.images.map((img) => (
                        <motion.div
                          key={img.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="flex gap-4 md:gap-6"
                        >
                          {/* Image */}
                          <div className="w-full max-w-lg shrink-0">
                            <div className="relative group rounded-2xl overflow-hidden bg-secondary">
                              <img
                                src={img.url}
                                alt={img.prompt}
                                className="w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          </div>

                          {/* Metadata - Right side (desktop) */}
                          <div className="hidden md:flex flex-col justify-between min-w-0 flex-1 py-1">
                            <div>
                              <p className="text-sm text-foreground leading-relaxed line-clamp-4 mb-3">
                                {img.prompt}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">
                                  {img.model}
                                </span>
                                <span className="text-[11px] px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-medium">
                                  {img.dimensions}
                                </span>
                                <span className="text-[11px] px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-medium flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {img.speed || "Fast"}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                  <DropdownMenuItem onClick={() => handleDownload(img.url, img.prompt)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(img.url); toast.success("Link copied!"); }}>
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setGeneratedImages((prev) => prev.filter((g) => g.id !== img.id))}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Mobile: metadata below image is handled inline */}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />
      </div>
    </AppLayout>
  );
};

export default ImagesPage;
