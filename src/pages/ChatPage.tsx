import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Camera, Image, FileUp, X, GraduationCap, ShoppingCart, ArrowDown, ChevronDown, Star, Pencil, Trash2, FolderPlus, Globe, Lock, Share2 } from "lucide-react";
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
import ConnectorsDialog from "@/components/ConnectorsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

const PegtopIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </svg>
);

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
  const [conversationTitle, setConversationTitle] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [attachedFiles, setAttachedFiles] = useState<{name: string;type: string;data: string;}[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"private" | "public">("private");
  const [isShared, setIsShared] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);

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
    if (data) { setConversationId(data.id); setConversationTitle(title); return data.id; }
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
    const { data: conv } = await supabase.from("conversations").select("title, is_shared, share_id").eq("id", id).single();
    if (conv) {
      setConversationTitle(conv.title || "Untitled");
      setIsShared(conv.is_shared || false);
      setShareId(conv.share_id || null);
      setShareMode(conv.is_shared ? "public" : "private");
    }
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setAttachedFiles([]); setIsLoading(true); setIsThinking(true);

    const convId = await createOrUpdateConversation(input);
    if (convId) await saveMessage(convId, "user", input);
    if (convId && messages.length === 0) {
      await supabase.from("conversations").update({ title: input.slice(0, 50), updated_at: new Date().toISOString() }).eq("id", convId);
      setConversationTitle(input.slice(0, 50));
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
    setMessages([]); setConversationId(null); setConversationTitle(""); setIsLoading(false); setIsThinking(false); setAttachedFiles([]); setSearchStatus(""); setChatMode("normal"); setSearchEnabled(false); setIsShared(false); setShareId(null); setShareMode("private");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachedFiles((prev) => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setAttachedFiles((prev) => [...prev, { name: file.name, type: "file", data: text.slice(0, 5000) }]);
      setInput((prev) => prev + `\n\nFile (${file.name}):\n${text.slice(0, 5000)}`);
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
    setShareDialogOpen(true);
  };

  const handleCreateShareLink = async () => {
    if (!conversationId) return;
    if (shareMode === "public") {
      const newShareId = shareId || Math.random().toString(36).substring(2, 10);
      const { error } = await supabase
        .from("conversations")
        .update({ is_shared: true, share_id: newShareId } as any)
        .eq("id", conversationId);
      if (error) { toast.error("Failed to share"); return; }
      setIsShared(true);
      setShareId(newShareId);
      const url = `${window.location.origin}/share/${newShareId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied!");
    } else {
      await supabase
        .from("conversations")
        .update({ is_shared: false } as any)
        .eq("id", conversationId);
      setIsShared(false);
      toast.success("Chat set to private");
    }
    setShareDialogOpen(false);
  };

  const handleRename = async () => {
    if (!conversationId || !renameValue.trim()) return;
    await supabase.from("conversations").update({ title: renameValue.trim() }).eq("id", conversationId);
    setConversationTitle(renameValue.trim());
    setIsRenaming(false);
    toast.success("Renamed");
  };

  const handleDelete = async () => {
    if (!conversationId) return;
    await supabase.from("messages").delete().eq("conversation_id", conversationId);
    await supabase.from("conversations").delete().eq("id", conversationId);
    toast.success("Deleted");
    handleNewChat();
  };

  const hasConversation = messages.length > 0;

  return (
    <AppLayout
      onSelectConversation={loadConversation}
      onNewChat={handleNewChat}
      activeConversationId={conversationId}
    >
      <div className="h-full flex flex-col bg-background">
        {/* Mobile sidebar */}
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="chat"
        />

        {/* Top header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 min-h-[48px]">
          {/* Left: mobile menu or conversation title */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            {hasConversation && conversationId ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-colors text-sm font-medium text-foreground max-w-[200px]">
                    <span className="truncate">{conversationTitle || "Untitled"}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => toast.success("Starred!")}>
                    <Star className="w-4 h-4 mr-2" />
                    Star
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setRenameValue(conversationTitle); setIsRenaming(true); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          {/* Center: plan badge (empty state only) */}
          {!hasConversation && (
            <button
              onClick={() => navigate("/pricing")}
              className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground bg-secondary/60 border border-border/50 transition-colors"
            >
              Free plan · <span className="text-foreground font-medium">Upgrade</span>
            </button>
          )}

          {/* Right: Share button */}
          <div className="flex items-center gap-2">
            {hasConversation && conversationId && (
              <button
                onClick={handleShare}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-foreground bg-secondary hover:bg-accent border border-border/50 transition-colors"
              >
                Share
              </button>
            )}
            {!hasConversation && (
              <AnimatePresence>
                <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="md:hidden">
                  <FancyButton onClick={() => navigate("/pricing")}>Unlock Pro</FancyButton>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 relative" ref={messagesContainerRef} onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center max-w-xl w-full">
                {/* Greeting */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <PegtopIcon className="text-primary" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Megsy chat?</h2>
                </div>

                {/* Input area */}
                <div className="w-full max-w-2xl mx-auto space-y-2">
                  <div className="relative">
                    <AnimatePresence>
                      {plusMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setPlusMenuOpen(false)} />
                          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-3 w-72">
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <button onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                                <Camera className="w-5 h-5 text-muted-foreground" />
                                <span className="text-[11px] text-foreground">Camera</span>
                              </button>
                              <button onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                                <Image className="w-5 h-5 text-muted-foreground" />
                                <span className="text-[11px] text-foreground">Photos</span>
                              </button>
                              <button onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                                <FileUp className="w-5 h-5 text-muted-foreground" />
                                <span className="text-[11px] text-foreground">Files</span>
                              </button>
                            </div>
                            <div className="border-t border-border pt-2 space-y-1">
                              <button onClick={handleSearchToggle} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                                <span className="text-sm text-foreground">Web search</span>
                                <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${searchEnabled ? "bg-primary justify-end" : "bg-border justify-start"}`}>
                                  <div className="w-4 h-4 rounded-full bg-white mx-0.5" />
                                </div>
                              </button>
                              <div className="border-t border-border mt-1 pt-1">
                                <p className="text-[10px] text-muted-foreground uppercase px-3 py-1.5">Modes</p>
                                <button onClick={() => handleModeChange("learning")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "learning" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                                  <span className="text-sm text-foreground">Learning Mode</span>
                                  {chatMode === "learning" && <span className="ml-auto text-xs text-primary">On</span>}
                                </button>
                                <button onClick={() => handleModeChange("shopping")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "shopping" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                                  <span className="text-sm text-foreground">Shopping Mode</span>
                                  {chatMode === "shopping" && <span className="ml-auto text-xs text-primary">On</span>}
                                </button>
                              </div>
                              <div className="border-t border-border mt-1 pt-1">
                                <button onClick={() => { navigate("/settings/integrations"); setPlusMenuOpen(false); }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                                  <span className="text-sm text-foreground">Integrations</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">PRO</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    <AnimatedInput value={input} onChange={setInput} onSend={handleSend} onCancel={handleCancel} onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)} disabled={isLoading} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel} />
                  </div>

                  {/* Connect your tools bar */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/40 border border-border/30">
                    <span className="text-xs text-muted-foreground">Connect your tools to Megsy</span>
                    <button
                      onClick={() => navigate("/settings/integrations")}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Browse →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 px-4 md:px-6 space-y-2">
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

          {/* Scroll to bottom */}
          <AnimatePresence>
            {showScrollBtn && messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ArrowDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Input (when conversation active) */}
        {hasConversation && (
          <div className="shrink-0 px-3 md:px-6 pb-3 md:pb-5 pt-1">
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
                    <button onClick={() => setChatMode("normal")} className="ml-1 p-0.5 rounded-full hover:bg-primary/15 transition-colors">
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
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-3 w-72">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <button onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                            <Camera className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[11px] text-foreground">Camera</span>
                          </button>
                          <button onClick={() => { imageInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                            <Image className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[11px] text-foreground">Photos</span>
                          </button>
                          <button onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                            <FileUp className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[11px] text-foreground">Files</span>
                          </button>
                        </div>
                        <div className="border-t border-border pt-2 space-y-1">
                          <button onClick={handleSearchToggle} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                            <span className="text-sm text-foreground">Web search</span>
                            <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${searchEnabled ? "bg-primary justify-end" : "bg-border justify-start"}`}>
                              <div className="w-4 h-4 rounded-full bg-white mx-0.5" />
                            </div>
                          </button>
                          <div className="px-3 py-2">
                            <ModelSelector mode="chat" selectedModel={selectedModel} onModelChange={(m) => setSelectedModel(m)} />
                          </div>
                        </div>
                        <div className="border-t border-border mt-1 pt-1">
                          <p className="text-[10px] text-muted-foreground uppercase px-3 py-1.5">Modes</p>
                          <button onClick={() => handleModeChange("learning")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "learning" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                            <span className="text-sm text-foreground">Learning Mode</span>
                            {chatMode === "learning" && <span className="ml-auto text-xs text-primary">On</span>}
                          </button>
                          <button onClick={() => handleModeChange("shopping")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "shopping" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                            <span className="text-sm text-foreground">Shopping Mode</span>
                            {chatMode === "shopping" && <span className="ml-auto text-xs text-primary">On</span>}
                          </button>
                        </div>
                        <div className="border-t border-border mt-1 pt-1">
                          <button onClick={() => { navigate("/settings/integrations"); setPlusMenuOpen(false); }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors">
                            <span className="text-sm text-foreground">Integrations</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">PRO</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <AnimatedInput value={input} onChange={setInput} onSend={handleSend} onCancel={handleCancel} onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)} disabled={isLoading} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel} />
              </div>
              <p className="text-[10px] text-center text-muted-foreground/50 mt-1">Megsy is AI and can make mistakes. Please double-check responses.</p>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css" />
              <input ref={imageInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" capture="environment" />
            </div>
          </div>
        )}

        {/* Hidden file inputs for empty state */}
        {!hasConversation && (
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css" />
            <input ref={imageInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" capture="environment" />
          </>
        )}

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share chat</DialogTitle>
              <DialogDescription>Only messages up to this point will be shared.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              <button
                onClick={() => setShareMode("private")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${shareMode === "private" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}
              >
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">Keep private</p>
                  <p className="text-xs text-muted-foreground">Only you have access</p>
                </div>
                {shareMode === "private" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
              <button
                onClick={() => setShareMode("public")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${shareMode === "public" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}
              >
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">Create public link</p>
                  <p className="text-xs text-muted-foreground">Anyone with the link can view</p>
                </div>
                {shareMode === "public" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Don't share personal information or third-party content without permission.
            </p>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleCreateShareLink}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                {shareMode === "public" ? "Create share link" : "Save"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Rename chat</DialogTitle>
            </DialogHeader>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsRenaming(false)} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleRename} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Save</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
