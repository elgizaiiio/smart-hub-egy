import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Paperclip, Sparkles, Download, Loader2, Settings2, Image as ImageIcon, Video, MoreHorizontal, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import AppLayout from "@/layouts/AppLayout";
import AppSidebar from "@/components/AppSidebar";
import { getDefaultModel } from "@/components/ModelSelector";
import type { ModelOption } from "@/components/ModelSelector";
import ThinkingLoader from "@/components/ThinkingLoader";
import ImageSettingsPanel, { MobileSettingsDrawer, DEFAULT_SETTINGS, type ImageSettings, type ImageStyle } from "@/components/ImageSettingsPanel";
import {
  getImageModelCapability,
  PUBLISH_PLATFORM_TO_APP,
  type PublishPlatform,
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
  dimensions: string;
  createdAt: Date;
  style?: string;
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

const ImagesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const capability = useMemo(() => getImageModelCapability(selectedModel.id), [selectedModel.id]);

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

    const creditCost = (Number(selectedModel.credits) || 1) * settings.numImages;
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
        // Handle both single and multi-image responses
        const urls: string[] = data.image_urls || (data.image_url ? [data.image_url] : []);

        const newImages: GeneratedImage[] = urls.map((url, idx) => ({
          id: crypto.randomUUID(),
          url,
          prompt: trimmed || "Generated image",
          model: selectedModel.name,
          dimensions: `${settings.dimensions.width}×${settings.dimensions.height}`,
          createdAt: new Date(),
          style: settings.style !== "none" ? settings.style : undefined,
        }));

        setGeneratedImages((prev) => [...newImages, ...prev]);

        if (convId) {
          await saveMessage(convId, "assistant", trimmed, urls);
        }
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
      const loadedImages = await Promise.all(
        filesToUse.map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await readFileAsDataUrl(file),
          mimeType: file.type || "image/jpeg",
          name: file.name,
        })),
      );
      setAttachedImages((prev) => [...prev, ...loadedImages]);
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
              dimensions: "1024×1024",
              createdAt: new Date(m.created_at),
            });
          });
        }
      });
      setGeneratedImages(images.reverse());
    }
  };

  const removeImage = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.slice(0, 30).replace(/\s+/g, "_")}.png`;
    a.target = "_blank";
    a.click();
  };

  const settingsPanelContent = (
    <ImageSettingsPanel
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
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

        {/* Desktop Left Settings Panel */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 shrink-0 border-r border-border bg-card/50 p-4 overflow-y-auto hidden md:block"
          >
            <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Generation Settings
            </h3>
            {settingsPanelContent}
          </motion.div>
        )}

        {/* Mobile Settings Drawer */}
        {isMobile && (
          <MobileSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)}>
            {settingsPanelContent}
          </MobileSettingsDrawer>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Tabs */}
            <div className="flex bg-secondary rounded-full p-1">
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-background text-foreground shadow-sm">
                <ImageIcon className="w-3.5 h-3.5" />
                Image
              </button>
              <button
                onClick={() => navigate("/videos")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Video
              </button>
            </div>

            <div className="flex-1" />

            {isMobile && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Prompt Bar */}
          <div className="shrink-0 px-4 py-3">
            <div className="max-w-3xl mx-auto">
              {/* Attached images preview */}
              {attachedImages.length > 0 && (
                <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
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

              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm focus-within:border-primary/50 transition-colors">
                {/* Attach button */}
                {capability.acceptsImages && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                )}

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={displayedPlaceholder + "│"}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-1.5 max-h-32"
                  style={{ minHeight: "32px" }}
                />

                <button
                  onClick={handleGenerate}
                  disabled={(!input.trim() && attachedImages.length === 0) || isGenerating}
                  className="shrink-0 h-9 px-5 flex items-center gap-2 rounded-xl font-medium text-sm transition-all disabled:opacity-30 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>

              {/* Info badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {selectedModel.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {settings.dimensions.label}
                </span>
                {settings.style !== "none" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {settings.style}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  ×{settings.numImages}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {(Number(selectedModel.credits) || 1) * settings.numImages} MC
                </span>
              </div>
            </div>
          </div>

          {/* Generated Images Grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isGenerating && generatedImages.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <ThinkingLoader />
              </div>
            )}

            {!isGenerating && generatedImages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-primary/50" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground mb-1">Create Stunning Images</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Describe what you want to see and let AI bring your vision to life. Adjust settings on the left to fine-tune your output.
                </p>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="max-w-5xl mx-auto">
                {isGenerating && (
                  <div className="mb-4">
                    <ThinkingLoader />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <AnimatePresence>
                    {generatedImages.map((img) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="aspect-square bg-secondary">
                          <img
                            src={img.url}
                            alt={img.prompt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-xs text-foreground line-clamp-2 mb-2">{img.prompt}</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{img.model}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{img.dimensions}</span>
                            {img.style && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">{img.style}</span>
                            )}
                          </div>
                        </div>

                        {/* Action menu */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleDownload(img.url, img.prompt)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(img.url); toast.success("Link copied!"); }}>
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => removeImage(img.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
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

export default ImagesPage;
