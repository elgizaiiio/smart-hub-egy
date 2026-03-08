import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Paperclip, ArrowUp, Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppSidebar from "@/components/AppSidebar";
import ModelSelector, { getDefaultModel } from "@/components/ModelSelector";
import ThinkingLoader from "@/components/ThinkingLoader";
import {
  getImageModelCapability,
  PUBLISH_PLATFORM_TO_APP,
  type PublishPlatform,
} from "@/lib/imageModelCapabilities";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

const IMAGE_PHRASES = [
  "Your vision, painted in pixels.",
  "A masterpiece, freshly rendered.",
  "Behold what imagination looks like.",
  "Art born from your words.",
  "The canvas speaks your language.",
  "Crafted with digital brushstrokes.",
  "Where thought becomes sight.",
  "A glimpse into the impossible.",
  "Reality, reimagined for you.",
  "From mind to masterpiece.",
  "Your idea, now immortalized.",
  "Pixels dancing to your tune.",
  "The AI muse delivers.",
  "A visual whisper of creativity.",
  "Freshly conjured, just for you.",
  "Your prompt, elevated to art.",
  "Digital alchemy at its finest.",
  "A new world in a frame.",
  "Imagination rendered in high fidelity.",
  "The machine dreams your dream.",
  "Art that didn't exist a second ago.",
  "Your concept, now tangible.",
  "Sculpted from pure imagination.",
  "A symphony of color and light.",
  "Rendered with algorithmic grace.",
  "The spark of an idea, visualized.",
  "Born from the void of creativity.",
  "A digital poem in pixels.",
  "Your words became this.",
  "Conjured from the depths of AI.",
  "A visual echo of your thoughts.",
  "Freshly forged in the neural fires.",
  "Where language meets light.",
  "The art of the impossible.",
  "Your narrative, illustrated.",
  "A frame-worthy moment, generated.",
  "Pixels aligning to your will.",
  "The intersection of code and canvas.",
  "A visual revelation awaits.",
  "Dreamt up and delivered.",
  "The algorithm paints for you.",
  "A digital daydream materialized.",
  "Your aesthetic, amplified.",
  "Creativity compressed into an image.",
  "A thousand computations, one artwork.",
  "The future of art, in your hands.",
  "Woven from threads of data.",
  "A portrait of pure possibility.",
  "Your imagination, no limits.",
  "Art without boundaries.",
];

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface AttachedImage {
  id: string;
  dataUrl: string;
  mimeType: string;
  name: string;
}

const SHOWCASE_IMAGES = [
  "https://e.top4top.io/p_3717n95ku1.jpg",
  "https://f.top4top.io/p_3717d6lc82.jpg",
  "https://g.top4top.io/p_37176ir4i3.jpg",
  "https://h.top4top.io/p_3717ym4ko4.jpg",
  "https://i.top4top.io/p_3717aa6g15.jpg",
  "https://j.top4top.io/p_3717fq0d26.jpg",
];

const PLACEHOLDERS = [
  "Describe your image...",
  "Logo design...",
  "Anime character...",
  "A sunset landscape...",
];

const PUBLISH_OPTIONS: { platform: PublishPlatform; label: string; Icon: () => JSX.Element }[] = [
  { platform: "facebook", label: "Facebook", Icon: FacebookIcon },
  { platform: "instagram", label: "Instagram", Icon: InstagramIcon },
  { platform: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
];

const getRandomPhrase = () => IMAGE_PHRASES[Math.floor(Math.random() * IMAGE_PHRASES.length)];

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

const ImagesPage = () => {
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("images"));
  const [currentImage, setCurrentImage] = useState(0);
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [connectedApps, setConnectedApps] = useState<Record<string, string>>({});
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const capability = useMemo(() => getImageModelCapability(selectedModel.id), [selectedModel.id]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentImage((p) => (p + 1) % SHOWCASE_IMAGES.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const loadConnections = async () => {
      setIsLoadingConnections(true);
      try {
        const { data, error } = await supabase.functions.invoke("composio", {
          body: { action: "list-connections", userId: "default" },
        });
        if (error) throw error;

        const items = data?.items || data || [];
        const connected: Record<string, string> = {};
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const appName = (item.appName || item.appUniqueId || "").toLowerCase();
            if (appName && item.status === "ACTIVE") {
              connected[appName] = item.id;
            }
          });
        }
        setConnectedApps(connected);
      } catch {
        toast.error("Failed to load integrations status");
      } finally {
        setIsLoadingConnections(false);
      }
    };

    void loadConnections();
  }, [menuOpen]);

  useEffect(() => {
    if (!capability.acceptsImages && attachedImages.length > 0) {
      setAttachedImages([]);
      toast.info(`${selectedModel.name} يعمل بالنص فقط، تم حذف الصور المرفقة.`);
      return;
    }

    if (capability.acceptsImages && attachedImages.length > capability.maxImages) {
      setAttachedImages((prev) => prev.slice(0, capability.maxImages));
      toast.info(`${selectedModel.name} يدعم حتى ${capability.maxImages} صورة فقط.`);
    }
  }, [capability.acceptsImages, capability.maxImages, selectedModel.name, attachedImages.length]);

  const createOrGetConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;

    const title = firstMessage.slice(0, 50) || "Image Generation";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "images", model: selectedModel.id })
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
      toast.error(`${selectedModel.name} يتطلب صورة واحدة على الأقل.`);
      return;
    }

    if (!capability.acceptsImages && attachedImages.length > 0) {
      toast.error(`${selectedModel.name} لا يقبل إدخال صور.`);
      return;
    }

    const creditCost = Number(selectedModel.credits) || 1;
    if (userId && !hasEnoughCredits(creditCost)) {
      toast.error("رصيد MC غير كافي. يرجى شحن حسابك.");
      return;
    }

    const userContent = trimmed || `Generate with ${selectedModel.name}`;
    const userMsg: ChatMsg = { role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    const convId = await createOrGetConversation(userContent);
    if (convId) await saveMessage(convId, "user", userContent);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: userContent,
          model: selectedModel.id,
          image_url: attachedImages[0]?.dataUrl,
          image_urls: attachedImages.map((img) => img.dataUrl),
          user_id: userId,
          credits_cost: Number(selectedModel.credits) || 1,
        }),
      });

      const data = await resp.json();

      if (data.error) {
        const errMsg = `Error: ${data.error}`;
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        if (convId) await saveMessage(convId, "assistant", errMsg);
      } else if (data.image_url) {
        const phrase = getRandomPhrase();
        setMessages((prev) => [...prev, { role: "assistant", content: phrase, imageUrl: data.image_url }]);
        if (convId) await saveMessage(convId, "assistant", phrase, [data.image_url]);
      } else {
        const noImg = "No image was returned. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: noImg }]);
        if (convId) await saveMessage(convId, "assistant", noImg);
      }
    } catch {
      const failMsg = "Generation failed. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: failMsg }]);
      if (convId) await saveMessage(convId, "assistant", failMsg);
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
      toast.error(`${selectedModel.name} لا يقبل إدخال الصور.`);
      e.target.value = "";
      return;
    }

    const remainingSlots = Math.max(capability.maxImages - attachedImages.length, 0);
    if (remainingSlots === 0) {
      toast.error(`${selectedModel.name} يدعم حتى ${capability.maxImages} صورة فقط.`);
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

      if (files.length > filesToUse.length) {
        toast.info(`تم إرفاق ${filesToUse.length} صورة فقط لأن ${selectedModel.name} يدعم حتى ${capability.maxImages} صورة.`);
      }
    } catch {
      toast.error("Failed to read attached image");
    }

    e.target.value = "";
  };

  const handleShare = (platform: PublishPlatform, imageUrl?: string) => {
    let targetImageUrl = imageUrl;
    if (!targetImageUrl) {
      const lastImg = [...messages].reverse().find((m) => m.imageUrl);
      targetImageUrl = lastImg?.imageUrl;
    }

    if (!targetImageUrl) {
      toast.error("No image to share");
      setMenuOpen(false);
      return;
    }

    const encodedUrl = encodeURIComponent(targetImageUrl);
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "instagram":
        navigator.clipboard.writeText(targetImageUrl);
        toast.success("Image link copied! Open Instagram and paste it.");
        setMenuOpen(false);
        return;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
    setMenuOpen(false);
  };

  const handlePublish = (platform: PublishPlatform, imageUrl?: string) => {
    const app = PUBLISH_PLATFORM_TO_APP[platform];
    if (!connectedApps[app]) {
      toast.info(`Connect ${app} first from Integrations`);
      setMenuOpen(false);
      navigate("/settings/integrations");
      return;
    }

    handleShare(platform, imageUrl);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setAttachedImages([]);
  };

  const removeAttachedImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((item) => item.id !== id));
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgs) {
      setMessages(msgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        imageUrl: m.images?.[0] || undefined,
      })));
    }
  };

  const hasMessages = messages.length > 0;
  const capabilityMimeText = capability.acceptedMimeTypes.length
    ? capability.acceptedMimeTypes.map((mime) => mime.replace("image/", "").toUpperCase()).join(", ")
    : "None";

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={loadConversation}
        activeConversationId={conversationId}
        currentMode="images"
      />

      <div className={`sticky top-0 z-20 flex items-center justify-between px-4 py-2 transition-opacity ${sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <ModelSelector mode="images" selectedModel={selectedModel} onModelChange={setSelectedModel} showCategories colorClass="bg-pink-500 text-white hover:bg-pink-600" />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-full max-w-xs aspect-[3/4] max-h-[50vh] relative rounded-2xl overflow-hidden mb-4">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={SHOWCASE_IMAGES[currentImage]}
                  alt="AI Generated"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {SHOWCASE_IMAGES.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? "bg-primary w-4" : "bg-primary/40"}`} />
                ))}
              </div>
            </div>

            <h2 className="font-display text-lg font-bold text-foreground mb-1">Create Stunning Images</h2>
            <p className="text-xs text-muted-foreground mb-3 text-center max-w-xs">Turn your imagination into beautiful artwork — just describe what you want to see</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 px-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex justify-end mb-4">
                    <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-foreground mb-2">{msg.content}</p>
                    {msg.imageUrl && (
                      <div className="relative group">
                        <img src={msg.imageUrl} alt="Generated" className="w-full max-w-md rounded-2xl" />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => window.open(msg.imageUrl, "_blank")} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          {PUBLISH_OPTIONS.map(({ platform, Icon, label }) => (
                            <button
                              key={platform}
                              onClick={() => handlePublish(platform, msg.imageUrl)}
                              className="p-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
                              title={`Publish to ${label}`}
                            >
                              <Icon />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isGenerating && <ThinkingLoader />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3 pt-1">
        <div className="max-w-3xl mx-auto">
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto">
              {attachedImages.map((img) => (
                <div key={img.id} className="relative shrink-0">
                  <img src={img.dataUrl} alt={img.name} className="w-10 h-10 rounded-lg object-cover" />
                  <button
                    onClick={() => removeAttachedImage(img.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-foreground text-[10px]"
                    aria-label="Remove attached image"
                  >
                    ×
                  </button>
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-1">{attachedImages.length}/{capability.maxImages}</span>
            </div>
          )}

          <div className="relative flex items-end gap-2 rounded-2xl border border-primary/30 bg-transparent backdrop-blur-md px-3 py-2">
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Plus className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-60">
                    <button
                      onClick={() => {
                        if (!capability.acceptsImages) {
                          toast.info(`${selectedModel.name} لا يدعم إدخال الصور.`);
                          setMenuOpen(false);
                          return;
                        }
                        fileInputRef.current?.click();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {capability.acceptsImages
                          ? `Attach Image (${capability.maxImages} max)`
                          : `${selectedModel.name} (Text-only)`}
                      </span>
                    </button>

                    <div className="border-t border-border mt-1 pt-1">
                      <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Publish to</p>

                      {PUBLISH_OPTIONS.map(({ platform, Icon, label }) => {
                        const app = PUBLISH_PLATFORM_TO_APP[platform];
                        const isConnected = Boolean(connectedApps[app]);

                        return (
                          <button
                            key={platform}
                            onClick={() => handlePublish(platform)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground"
                          >
                            <Icon />
                            <span>{label}</span>
                            <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${isConnected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                              {isLoadingConnections ? "..." : isConnected ? "Connected" : "Connect"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <textarea
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
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
              style={{ minHeight: "32px" }}
            />

            <button
              onClick={handleGenerate}
              disabled={(!input.trim() && attachedImages.length === 0) || isGenerating}
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-20 ${isGenerating ? "bg-[#7C3AED] text-white animate-pulse-slow" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>

          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />

          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileAttach} multiple />
        </div>
      </div>
    </div>
  );
};

export default ImagesPage;
