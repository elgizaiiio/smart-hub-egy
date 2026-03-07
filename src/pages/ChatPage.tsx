import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Globe, Camera, Image, FileUp, GraduationCap, ShoppingCart, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import ChatMessage from "@/components/ChatMessage";
import AnimatedInput from "@/components/AnimatedInput";
import ModelSelector, { getDefaultModel, type ModelOption } from "@/components/ModelSelector";
import ThinkingLoader from "@/components/ThinkingLoader";
import FancyButton from "@/components/FancyButton";
import { streamChat } from "@/lib/streamChat";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  attachedImages?: string[];
  liked?: boolean | null;
  id?: string;
}

type ChatMode = "normal" | "learning" | "shopping";

const MODE_PROMPTS: Record<ChatMode, string> = {
  normal: "",
  learning: "You are in Learning Mode. Explain everything step by step with examples, analogies, and clear breakdowns. Make complex topics easy to understand. Use bullet points, numbered steps, and structured format.",
  shopping: "You are in Shopping Mode. Help the user find the best products, compare prices, suggest alternatives, and provide purchase recommendations. Include pros/cons when comparing items.",
};

const DAILY_PHOTO_KEY = "megsy_daily_photos";
const MAX_DAILY_PHOTOS = 3;

const getDailyPhotoCount = (): number => {
  const stored = localStorage.getItem(DAILY_PHOTO_KEY);
  if (!stored) return 0;
  try {
    const { date, count } = JSON.parse(stored);
    if (date === new Date().toDateString()) return count;
    return 0;
  } catch { return 0; }
};

const incrementDailyPhoto = () => {
  const count = getDailyPhotoCount() + 1;
  localStorage.setItem(DAILY_PHOTO_KEY, JSON.stringify({ date: new Date().toDateString(), count }));
};

const ChatPage = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("chat"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createOrUpdateConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const title = firstMessage.slice(0, 50) || "New Chat";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "chat", model: selectedModel.id })
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

  const handleLike = async (index: number, liked: boolean | null) => {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, liked } : m));
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (msgs) {
      setMessages(msgs.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        images: m.images || undefined,
        liked: m.liked,
        id: m.id,
      })));
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsThinking(false);
    setSearchStatus("");
  };

  const handleModeChange = (mode: ChatMode) => {
    setChatMode(prev => prev === mode ? "normal" : mode);
    if (mode !== "normal") setSearchEnabled(false);
    setPlusMenuOpen(false);
  };

  const handleSearchToggle = () => {
    setSearchEnabled(!searchEnabled);
    if (!searchEnabled) setChatMode("normal");
    setPlusMenuOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    // Build multimodal message content
    const imageAttachments = attachedFiles.filter(f => f.type === "image" || f.type === "video");
    const textParts: string[] = [];
    if (input.trim()) textParts.push(input.trim());
    
    // Add non-image file contents to text
    const fileAttachments = attachedFiles.filter(f => f.type === "file");
    fileAttachments.forEach(f => {
      textParts.push(`\n\nFile (${f.name}):\n${f.data}`);
    });

    const displayContent = textParts.join("") || "Sent an image";
    const userMsg: Message = {
      role: "user",
      content: displayContent,
      attachedImages: imageAttachments.map(f => f.data),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const currentAttachedFiles = [...attachedFiles];
    setAttachedFiles([]);
    setIsLoading(true);
    setIsThinking(true);

    const convId = await createOrUpdateConversation(displayContent);
    if (convId) await saveMessage(convId, "user", displayContent);

    if (convId && messages.length === 0) {
      await supabase.from("conversations").update({
        title: displayContent.slice(0, 50),
        updated_at: new Date().toISOString()
      }).eq("id", convId);
    }

    let assistantContent = "";
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const updateAssistant = (chunk: string) => {
      setIsThinking(false);
      setSearchStatus("");
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    // Search context
    let searchContext = "";
    let searchImages: string[] = [];
    if (searchEnabled) {
      try {
        const searchQuery = input.replace(/@\w+\s*/g, "").trim();
        setSearchStatus(`Searching for "${searchQuery}"`);
        const searchResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query: searchQuery }),
          signal: controller.signal,
        });
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          searchContext = searchData.context || "";
          searchImages = searchData.images || [];
        }
        setSearchStatus("Thinking");
      } catch { /* continue without search */ }
    }

    // Build messages for API - support multimodal content
    const allMessages: any[] = [...messages, userMsg].map(m => {
      // For the current user message, build multimodal if images attached
      if (m === userMsg && imageAttachments.length > 0) {
        const contentParts: any[] = [];
        // Add images first
        imageAttachments.forEach(f => {
          if (f.type === "video") {
            contentParts.push({ type: "image_url", image_url: { url: f.data } });
          } else {
            contentParts.push({ type: "image_url", image_url: { url: f.data } });
          }
        });
        // Add text
        if (textParts.join("").trim()) {
          contentParts.push({ type: "text", text: textParts.join("").trim() });
        }
        return { role: m.role, content: contentParts };
      }
      return { role: m.role, content: m.content };
    });
    
    // Add mode prompt
    if (chatMode !== "normal" && MODE_PROMPTS[chatMode]) {
      allMessages.unshift({ role: "user" as const, content: `[System instruction]: ${MODE_PROMPTS[chatMode]}` });
    }

    if (searchContext) {
      allMessages.push({ role: "user" as const, content: `[Search results]:\n${searchContext}\n\nUse these results to answer accurately. Include source links when relevant.` });
    }

    // Set search images immediately on the assistant message
    if (searchImages.length > 0) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, images: searchImages } : m);
        }
        return [...prev, { role: "assistant", content: "", images: searchImages }];
      });
    }

    await streamChat({
      messages: allMessages,
      model: selectedModel.id,
      onDelta: updateAssistant,
      onDone: async () => {
        setIsLoading(false);
        setIsThinking(false);
        setSearchStatus("");
        if (convId && assistantContent) {
          await saveMessage(convId, "assistant", assistantContent, searchImages.length > 0 ? searchImages : undefined);
          // Ensure search images are on the final message
          if (searchImages.length > 0) {
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, images: searchImages } : m);
              }
              return prev;
            });
          }
          await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
        }
      },
      onError: (err) => { toast.error(err); setIsThinking(false); setIsLoading(false); setSearchStatus(""); },
      signal: controller.signal,
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
    setIsThinking(false);
    setAttachedFiles([]);
    setSearchStatus("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles(prev => [...prev, { name: file.name, type: file.type.startsWith("video/") ? "video" : "image", data: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setAttachedFiles(prev => [...prev, { name: file.name, type: "file", data: text.slice(0, 5000) }]);
    }
    e.target.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFiles(prev => [...prev, { name: file.name, type: file.type.startsWith("video/") ? "video" : "image", data: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const count = getDailyPhotoCount();
    if (count >= MAX_DAILY_PHOTOS) {
      toast.error(`Daily photo limit reached (${MAX_DAILY_PHOTOS}/day). Upgrade for unlimited.`);
      e.target.value = "";
      return;
    }
    incrementDailyPhoto();
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={loadConversation}
        activeConversationId={conversationId}
        currentMode="chat"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Mode badge */}
          {chatMode !== "normal" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary backdrop-blur-sm font-medium">
              {chatMode === "learning" ? "Learning" : "Shopping"}
            </span>
          )}
          <AnimatePresence>
            {!hasConversation && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <FancyButton onClick={() => navigate("/pricing")}>
                  Unlock Pro
                </FancyButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleNewChat}
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-lg"
            >
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-foreground">
                Hey, what's up?
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {[
                  { label: "Images", path: "/images" },
                  { label: "Videos", path: "/videos" },
                  { label: "Files", path: "/files" },
                  { label: "Code", path: "/code" },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 px-4 space-y-2">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                images={msg.images}
                attachedImages={msg.attachedImages}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                isThinking={isThinking && i === messages.length - 1 && msg.role === "assistant" && !msg.content}
                liked={msg.liked}
                onLike={(liked) => handleLike(i, liked)}
              />
            ))}
            {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
              <ThinkingLoader searchQuery={searchEnabled ? input : undefined} searchStatus={searchStatus} />
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (
              <ThinkingLoader />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        <div className="max-w-3xl mx-auto space-y-1.5">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 px-2 overflow-x-auto pb-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground border border-border">
                  {f.type === "image" ? (
                    <img src={f.data} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : f.type === "video" ? (
                    <video src={f.data} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <FileUp className="w-3 h-3" />
                  )}
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            {/* Plus Menu */}
            <AnimatePresence>
              {plusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPlusMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-3 w-72"
                  >
                    {/* Camera / Photos / Files grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                      >
                        <Camera className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[11px] text-foreground">Camera</span>
                      </button>
                      <button
                        onClick={() => { photoInputRef.current?.click(); setPlusMenuOpen(false); }}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                      >
                        <Image className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[11px] text-foreground">Photos</span>
                      </button>
                      <button
                        onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); }}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                      >
                        <FileUp className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[11px] text-foreground">Files</span>
                      </button>
                    </div>

                    <div className="border-t border-border pt-2 space-y-1">
                      {/* Web Search toggle */}
                      <button
                        onClick={handleSearchToggle}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Web search</span>
                        </div>
                        <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${searchEnabled ? "bg-primary justify-end" : "bg-border justify-start"}`}>
                          <div className="w-4 h-4 rounded-full bg-white mx-0.5" />
                        </div>
                      </button>

                      {/* Model selector */}
                      <div className="px-3 py-2">
                        <ModelSelector
                          mode="chat"
                          selectedModel={selectedModel}
                          onModelChange={(m) => { setSelectedModel(m); }}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border mt-1 pt-1">
                      <p className="text-[10px] text-muted-foreground uppercase px-3 py-1.5">Modes</p>
                      <button
                        onClick={() => handleModeChange("learning")}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "learning" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
                      >
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Learning Mode</span>
                        {chatMode === "learning" && <span className="ml-auto text-xs text-primary">On</span>}
                      </button>
                      <button
                        onClick={() => handleModeChange("shopping")}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "shopping" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
                      >
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Shopping Mode</span>
                        {chatMode === "shopping" && <span className="ml-auto text-xs text-primary">On</span>}
                      </button>
                    </div>

                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => { navigate("/settings/integrations"); setPlusMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors"
                      >
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Integrations</span>
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">PRO</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <AnimatedInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onCancel={handleCancel}
              onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)}
              disabled={isLoading}
              isLoading={isLoading}
            />
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.docx,.xlsx,.xml,.yaml,.toml" />
          <input ref={imageInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*,video/*" capture="environment" />
          <input ref={photoInputRef} type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
