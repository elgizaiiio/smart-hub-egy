import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Camera, Image, FileUp, X, GraduationCap, ShoppingCart, ArrowDown, Globe, Puzzle, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
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
  liked?: boolean | null;
  id?: string;
}

type ChatMode = "normal" | "learning" | "shopping";

const MODE_PROMPTS: Record<ChatMode, string> = {
  normal: "",
  learning: "You are in Learning Mode. Explain everything step by step with examples, analogies, and clear breakdowns. Make complex topics easy to understand. Use bullet points, numbered steps, and structured format.",
  shopping: "You are in Shopping Mode. Help the user find the best products, compare prices, suggest alternatives, and provide purchase recommendations. Include pros/cons when comparing items."
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
  const [attachedFiles, setAttachedFiles] = useState<{name: string;type: string;data: string;}[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createOrUpdateConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) || "New Chat";
    const { data } = await supabase.from("conversations").insert({ title, mode: "chat", model: selectedModel.id, user_id: user.id } as any).select("id").single();
    if (data) { setConversationId(data.id); return data.id; }
    return null;
  };

  const saveMessage = async (convId: string, role: string, content: string, images?: string[]) => {
    await supabase.from("messages").insert({ conversation_id: convId, role, content, images: images || null });
  };

  const handleLike = async (index: number, liked: boolean | null) => {
    setMessages((prev) => prev.map((m, i) => i === index ? { ...m, liked } : m));
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (msgs) {
      setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content, images: m.images || undefined, liked: m.liked, id: m.id })));
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setIsLoading(false); setIsThinking(false); setSearchStatus("");
  };

  const handleModeChange = (mode: ChatMode) => {
    setChatMode((prev) => prev === mode ? "normal" : mode);
    if (mode !== "normal") setSearchEnabled(false);
    setPlusMenuOpen(false);
  };

  const handleSearchToggle = () => {
    setSearchEnabled(!searchEnabled);
    if (!searchEnabled) setChatMode("normal");
    setPlusMenuOpen(false);
  };

  const handleOpenFilesPicker = () => {
    const input = fileInputRef.current;
    if (!input) return;

    try {
      const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
      if (typeof pickerInput.showPicker === "function") {
        pickerInput.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }

    setPlusMenuOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setAttachedFiles([]); setIsLoading(true); setIsThinking(true);

    const convId = await createOrUpdateConversation(input);
    if (convId) await saveMessage(convId, "user", input);
    if (convId && messages.length === 0) {
      await supabase.from("conversations").update({ title: input.slice(0, 50), updated_at: new Date().toISOString() }).eq("id", convId);
    }

    let assistantContent = "";
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let searchImages: string[] = [];

    const updateAssistant = (chunk: string) => {
      setIsThinking(false); setSearchStatus("");
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    const imageAttachments = attachedFiles.filter((f) => f.type === "image");
    const allMessages = [...messages, userMsg].map((m) => {
      if (m === userMsg && imageAttachments.length > 0) {
        return { role: m.role, content: [...imageAttachments.map((f) => ({ type: "image_url" as const, image_url: { url: f.data } })), { type: "text" as const, text: m.content }] };
      }
      return { role: m.role, content: m.content };
    });

    if (chatMode !== "normal" && MODE_PROMPTS[chatMode]) {
      allMessages.unshift({ role: "user" as const, content: `[System instruction]: ${MODE_PROMPTS[chatMode]}` });
    }
    if (searchEnabled) setSearchStatus("Agent is thinking...");

    await streamChat({
      messages: allMessages, model: selectedModel.id, searchEnabled,
      onDelta: updateAssistant,
      onImages: (imgs) => { searchImages = imgs; },
      onDone: async () => {
        setIsLoading(false); setIsThinking(false); setSearchStatus("");
        if (convId && assistantContent) {
          await saveMessage(convId, "assistant", assistantContent, searchImages.length > 0 ? searchImages : undefined);
          if (searchImages.length > 0) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, images: searchImages } : m);
              return prev;
            });
          }
          await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
        }
      },
      onError: (err) => { toast.error(err); setIsThinking(false); setIsLoading(false); setSearchStatus(""); },
      signal: controller.signal
    });
  };

  const handleNewChat = () => {
    setMessages([]); setConversationId(null); setIsLoading(false); setIsThinking(false); setAttachedFiles([]); setSearchStatus(""); setChatMode("normal"); setSearchEnabled(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTextFile =
      file.type.startsWith("text/") ||
      /\.(txt|md|csv|json|js|ts|py|html|css|xml|yml|yaml|log)$/i.test(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachedFiles((prev) => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
      reader.readAsDataURL(file);
    } else if (isTextFile) {
      const text = await file.text();
      setAttachedFiles((prev) => [...prev, { name: file.name, type: "file", data: text.slice(0, 5000) }]);
      setInput((prev) => prev + `\n\nFile (${file.name}):\n${text.slice(0, 5000)}`);
    } else {
      setAttachedFiles((prev) => [...prev, { name: file.name, type: "file", data: "" }]);
      setInput((prev) => prev + `\n\nAttached file: ${file.name}`);
      toast.success(`${file.name} attached`);
    }

    e.target.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedFiles((prev) => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleShare = async () => {
    if (!conversationId) return;
    const shareId = Math.random().toString(36).substring(2, 10);
    const { error } = await supabase
      .from("conversations")
      .update({ is_shared: true, share_id: shareId } as any)
      .eq("id", conversationId);
    if (error) { toast.error("Failed to share"); return; }
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  };

  const hasConversation = messages.length > 0;

  return (
    <AppLayout
      onSelectConversation={loadConversation}
      onNewChat={handleNewChat}
      activeConversationId={conversationId}
    >
      <div className="h-full flex flex-col bg-background">
        {/* Mobile-only header */}
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="chat"
        />

        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {!hasConversation && (
              <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <FancyButton onClick={() => navigate("/pricing")}>Unlock Pro</FancyButton>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-9" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 relative" ref={messagesContainerRef} onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center max-w-lg">
                <h2 className="font-display text-2xl md:text-4xl font-bold mb-3 text-foreground">Hey, what's up?</h2>
                <p className="hidden md:block text-muted-foreground text-sm mb-6">Ask me anything -- I'm here to help with chat, code, images, and more.</p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  {[{ label: "Images", path: "/images" }, { label: "Videos", path: "/videos" }, { label: "Files", path: "/files" }, { label: "Code", path: "/code" }].map((item) => (
                    <button key={item.label} onClick={() => navigate(item.path)} className="px-5 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border">
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 px-4 md:px-6 space-y-2 pb-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} images={msg.images} isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"} isThinking={isThinking && i === messages.length - 1 && msg.role === "assistant" && !msg.content} liked={msg.liked} onLike={(liked) => handleLike(i, liked)} onShare={msg.role === "assistant" && conversationId ? handleShare : undefined} />
              ))}
              {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
                <ThinkingLoader searchQuery={searchEnabled ? input : undefined} searchStatus={searchStatus} />
              )}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && <ThinkingLoader />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Fixed Input Footer */}
        <div className="shrink-0 z-10 px-3 md:px-6 pt-3 pb-4 bg-background" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
          <div className="max-w-3xl mx-auto space-y-1.5">
            {/* Active mode badge */}
            <AnimatePresence>
              {chatMode !== "normal" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 backdrop-blur-md border border-primary/15 w-fit"
                >
                  {chatMode === "learning" ? (
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="text-xs text-primary font-medium">
                    {chatMode === "learning" ? "Learning" : "Shopping"} Mode
                  </span>
                  <button
                    onClick={() => setChatMode("normal")}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary/15 transition-colors"
                  >
                    <X className="w-3 h-3 text-primary" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {attachedFiles.length > 0 && (
              <div className="flex gap-2 px-2 overflow-x-auto pb-1">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground border border-border">
                    {f.type === "image" ? <img src={f.data} alt="" className="w-8 h-8 rounded object-cover" /> : <FileUp className="w-3 h-3" />}
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">x</button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <AnimatePresence>
                {plusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setPlusMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-1.5 w-[min(260px,calc(100vw-2rem))] max-h-[min(70vh,480px)] overflow-y-auto rounded-2xl"
                    >
                      {/* ATTACH */}
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-1.5">Attach</p>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <button onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl hover:bg-accent/60 transition-all group">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <Camera className="w-4 h-4 text-emerald-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">Camera</p>
                        </button>
                        <button onClick={() => { photoInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl hover:bg-accent/60 transition-all group">
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <Image className="w-4 h-4 text-blue-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">Photos</p>
                        </button>
                        <button onClick={handleOpenFilesPicker} className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl hover:bg-accent/60 transition-all group">
                          <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                            <FileUp className="w-4 h-4 text-violet-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">Files</p>
                        </button>
                      </div>

                      {/* TOOLS */}
                      <div className="border-t border-border pt-1.5 mt-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-0.5">Tools</p>
                        <button onClick={handleSearchToggle} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-accent/60 transition-all group">
                           <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                            <Globe className="w-3 h-3 text-sky-500" />
                          </div>
                          <div className="flex-1 min-w-0 leading-tight">
                            <p className="text-[13px] text-foreground font-medium leading-none">Web Search</p>
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Search the web</p>
                          </div>
                          <div className={`w-8 h-[18px] rounded-full transition-colors flex items-center ${searchEnabled ? "bg-primary justify-end" : "bg-border justify-start"}`}>
                            <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
                          </div>
                        </button>
                      </div>

                      {/* MODEL */}
                      <div className="border-t border-border pt-1.5 mt-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-1">Model</p>
                        <div className="px-1">
                          <ModelSelector mode="chat" selectedModel={selectedModel} onModelChange={(m) => setSelectedModel(m)} />
                        </div>
                      </div>

                      {/* MODES */}
                      <div className="border-t border-border pt-1.5 mt-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-0.5">Modes</p>
                        <button onClick={() => handleModeChange("learning")} className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left transition-all group ${chatMode === "learning" ? "bg-primary/10" : "hover:bg-accent/60"}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${chatMode === "learning" ? "bg-primary/20" : "bg-emerald-500/10 group-hover:bg-emerald-500/20"}`}>
                            <GraduationCap className={`w-3 h-3 ${chatMode === "learning" ? "text-primary" : "text-emerald-500"}`} />
                          </div>
                          <div className="flex-1 leading-tight">
                            <p className="text-[13px] text-foreground font-medium leading-none">Learning</p>
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Learn step by step</p>
                          </div>
                          {chatMode === "learning" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">ON</span>}
                        </button>
                        <button onClick={() => handleModeChange("shopping")} className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left transition-all group ${chatMode === "shopping" ? "bg-primary/10" : "hover:bg-accent/60"}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${chatMode === "shopping" ? "bg-primary/20" : "bg-rose-500/10 group-hover:bg-rose-500/20"}`}>
                            <ShoppingCart className={`w-3 h-3 ${chatMode === "shopping" ? "text-primary" : "text-rose-500"}`} />
                          </div>
                          <div className="flex-1 leading-tight">
                            <p className="text-[13px] text-foreground font-medium leading-none">Shopping</p>
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Find best deals</p>
                          </div>
                          {chatMode === "shopping" && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">ON</span>}
                        </button>
                      </div>

                      {/* INTEGRATIONS - PREMIUM */}
                      <div className="border-t border-border pt-1.5 mt-1">
                        <button onClick={() => { navigate("/settings/integrations"); setPlusMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left hover:bg-accent/60 transition-all group">
                           <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400/15 to-amber-600/15 flex items-center justify-center group-hover:from-amber-400/25 group-hover:to-amber-600/25 transition-colors">
                            <Puzzle className="w-3 h-3 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] text-foreground font-medium">Integrations</p>
                          </div>
                          <span className="text-[7px] px-2 py-[2px] rounded-full bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-amber-500/10 border border-amber-400/25 font-bold tracking-[0.15em] uppercase"><span className="text-amber-400">Pro</span><span className="text-amber-500/40 mx-[3px]">·</span><span className="text-amber-500">Premium</span></span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <AnimatedInput value={input} onChange={setInput} onSend={handleSend} onCancel={handleCancel} onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)} disabled={isLoading} isLoading={isLoading} />
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <input ref={imageInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" capture="environment" />
            <input ref={photoInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
