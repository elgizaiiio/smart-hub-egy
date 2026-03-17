import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Camera, Image, FileUp, X, GraduationCap, ShoppingCart, ArrowDown, ChevronDown, Star, Pencil, Trash2, FolderPlus, Globe, Lock, Share2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ChatMessage from "@/components/ChatMessage";
import AnimatedInput from "@/components/AnimatedInput";
import ModelSelector, { getDefaultModel, getModelsForMode, type ModelOption } from "@/components/ModelSelector";
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
  attachedImages?: string[];
  attachedFiles?: { name: string; type: string }[];
  liked?: boolean | null;
  id?: string;
}

type ChatMode = "normal" | "learning" | "shopping" | "deep-research";

const MODE_PROMPTS: Record<ChatMode, string> = {
  normal: "",
  learning: "You are in Learning Mode. Explain everything step by step with examples, analogies, and clear breakdowns. Make complex topics easy to understand. Use bullet points, numbered steps, and structured format.",
  shopping: "You are in Shopping Mode. Help the user find the best products, compare prices, suggest alternatives, and provide purchase recommendations. Include pros/cons when comparing items.",
  "deep-research": "",
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
  const [attachedFiles, setAttachedFiles] = useState<{name: string; type: string; data: string;}[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"private" | "public">("public");
  const [isShared, setIsShared] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [modelsExpanded, setModelsExpanded] = useState(false);

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
      setTimeout(() => scrollToBottom(), 150);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setIsLoading(false); setIsThinking(false); setSearchStatus("");
  };

  const handleModeChange = (mode: ChatMode) => {
    setChatMode((prev) => prev === mode ? "normal" : mode);
    if (mode === "deep-research") {
      setSearchEnabled(true);
    } else if (mode !== "normal") {
      setSearchEnabled(false);
    }
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

    // Build user message with attachments metadata
    const imageAttachments = attachedFiles.filter((f) => f.type === "image");
    const fileAttachments = attachedFiles.filter((f) => f.type === "file");

    const userMsg: Message = {
      role: "user",
      content: input || (attachedFiles.length > 0 ? `[${attachedFiles.length} file(s) attached]` : ""),
      attachedImages: imageAttachments.map(f => f.data),
      attachedFiles: fileAttachments.map(f => ({ name: f.name, type: f.type })),
    };
    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput(""); 
    const currentFiles = [...attachedFiles];
    setAttachedFiles([]); 
    setIsLoading(true); setIsThinking(true);

    const convId = await createOrUpdateConversation(userInput || "File analysis");
    if (convId) await saveMessage(convId, "user", userInput || `[${currentFiles.length} file(s) attached]`);
    if (convId && messages.length === 0) {
      const title = (userInput || "File analysis").slice(0, 50);
      await supabase.from("conversations").update({ title, updated_at: new Date().toISOString() }).eq("id", convId);
      setConversationTitle(title);
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

    // Build multimodal messages for the AI
    const allMessages = [...messages, userMsg].map((m) => {
      const imgs = m.attachedImages || [];
      const files = m.attachedFiles || [];
      
      // If this message has image attachments, send as multimodal
      if (imgs.length > 0) {
        const content: any[] = imgs.map((imgData) => ({
          type: "image_url" as const,
          image_url: { url: imgData },
        }));
        if (m.content) {
          content.push({ type: "text" as const, text: m.content });
        }
        return { role: m.role, content };
      }
      
      return { role: m.role, content: m.content };
    });

    // Add file content to the last user message
    if (currentFiles.some(f => f.type === "file")) {
      const fileTexts = currentFiles
        .filter(f => f.type === "file")
        .map(f => `--- File: ${f.name} ---\n${f.data}`)
        .join("\n\n");
      
      const lastMsg = allMessages[allMessages.length - 1];
      if (typeof lastMsg.content === "string") {
        lastMsg.content = `${lastMsg.content}\n\n${fileTexts}`;
      }
    }

    if (chatMode !== "normal" && MODE_PROMPTS[chatMode]) {
      allMessages.unshift({ role: "user" as const, content: `[System instruction]: ${MODE_PROMPTS[chatMode]}` });
    }
    const isDeepResearch = chatMode === "deep-research";
    if (searchEnabled || isDeepResearch) setSearchStatus(isDeepResearch ? "Deep Research in progress..." : "Agent is thinking...");

    await streamChat({
      messages: allMessages, model: selectedModel.id, searchEnabled: searchEnabled || isDeepResearch,
      deepResearch: isDeepResearch,
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
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setAttachedFiles((prev) => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        setAttachedFiles((prev) => [...prev, { name: file.name, type: "file", data: text.slice(0, 8000) }]);
      }
    });
    e.target.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setAttachedFiles((prev) => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedFiles((prev) => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
    reader.readAsDataURL(file);
    e.target.value = "";
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
      setGeneratedShareUrl(url);
    } else {
      await supabase
        .from("conversations")
        .update({ is_shared: false } as any)
        .eq("id", conversationId);
      setIsShared(false);
      setGeneratedShareUrl(null);
      toast.success("Chat set to private");
      setShareDialogOpen(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (generatedShareUrl) {
      await navigator.clipboard.writeText(generatedShareUrl);
      toast.success("Link copied!");
    }
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

  // Render the plus menu content (shared between all 3 locations)
  const renderPlusMenu = (isMobile: boolean) => (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setPlusMenuOpen(false)} />
      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-3 w-72">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={() => { cameraInputRef.current?.click(); setPlusMenuOpen(false); }} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
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
          {isMobile && (
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => setModelsExpanded(!modelsExpanded)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm text-foreground">{selectedModel.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${modelsExpanded ? "rotate-180" : ""}`} />
              </button>
              {modelsExpanded && (
                <div className="space-y-0.5 mt-1">
                  {getModelsForMode("chat").map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m); setModelsExpanded(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedModel.id === m.id ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm">{m.name}</span>
                      {selectedModel.id === m.id && <span className="text-xs text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isMobile && (
            <div className="px-3 py-2">
              <ModelSelector mode="chat" selectedModel={selectedModel} onModelChange={(m) => setSelectedModel(m)} />
            </div>
          )}
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
            <button onClick={() => handleModeChange("deep-research")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${chatMode === "deep-research" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
              <span className="text-sm text-foreground">Deep Research</span>
              {chatMode === "deep-research" && <span className="ml-auto text-xs text-primary">On</span>}
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
  );

  // Render attached files preview
  const renderAttachments = () => {
    if (attachedFiles.length === 0) return null;
    return (
      <div className="flex gap-2 px-2 overflow-x-auto pb-1 mb-1">
        {attachedFiles.map((f, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground border border-border shrink-0">
            {f.type === "image" ? <img src={f.data} alt="" className="w-8 h-8 rounded object-cover" /> : <FileUp className="w-3 h-3" />}
            <span className="truncate max-w-[100px]">{f.name}</span>
            <button onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout
      onSelectConversation={loadConversation}
      onNewChat={handleNewChat}
      activeConversationId={conversationId}
    >
      <div className="h-full flex flex-col bg-background overflow-x-hidden">
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="chat"
        />

        {/* Top header bar — transparent with blur so content scrolls behind */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 min-h-[48px] bg-background/60 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block" />
          </div>

          {!hasConversation && (
            <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
              <FancyButton onClick={() => navigate("/pricing")}>Unlock Pro</FancyButton>
            </div>
          )}

          <div className="flex items-center gap-2">
            {hasConversation && conversationId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                    <MoreVertical className="w-4.5 h-4.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-lg shadow-xl p-1.5">
                  <DropdownMenuItem onClick={handleShare} className="rounded-lg px-3 py-2.5 text-sm gap-3 cursor-pointer">
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setRenameValue(conversationTitle); setIsRenaming(true); }} className="rounded-lg px-3 py-2.5 text-sm gap-3 cursor-pointer">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={handleDelete} className="rounded-lg px-3 py-2.5 text-sm gap-3 cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 relative" ref={messagesContainerRef} onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="flex flex-col h-full px-4">
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center max-w-xl w-full">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <PegtopIcon className="text-primary" />
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Ask Megsy ?</h2>
                  </div>

                  <div className="flex md:hidden items-center justify-center gap-2 mb-6 flex-wrap">
                    <button onClick={() => navigate("/images")} className="px-3 py-1.5 rounded-full border border-border/50 bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      Photos
                    </button>
                    <button onClick={() => navigate("/files")} className="px-3 py-1.5 rounded-full border border-border/50 bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      Files
                    </button>
                    <button onClick={() => navigate("/videos")} className="px-3 py-1.5 rounded-full border border-border/50 bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      Videos
                    </button>
                    <button onClick={() => navigate("/code")} className="px-3 py-1.5 rounded-full border border-border/50 bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      Code
                    </button>
                  </div>

                  {/* Desktop: Input centered */}
                  <div className="hidden md:block w-full max-w-2xl mx-auto space-y-2 mt-4">
                    <div className="relative">
                      <AnimatePresence>
                        {plusMenuOpen && renderPlusMenu(false)}
                      </AnimatePresence>
                      <AnimatedInput value={input} onChange={setInput} onSend={handleSend} onCancel={handleCancel} onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)} disabled={isLoading} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel} />
                    </div>
                    <button
                      onClick={() => setConnectorsOpen(true)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border/30 hover:bg-secondary/60 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground">Connect your tools to Megsy</span>
                      <span className="text-xs text-primary font-medium">Browse →</span>
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Mobile: Input pinned to bottom */}
              <div className="shrink-0 pb-3 md:hidden w-full max-w-2xl mx-auto space-y-2">
                {renderAttachments()}
                <div className="relative">
                  <AnimatePresence>
                    {plusMenuOpen && renderPlusMenu(true)}
                  </AnimatePresence>
                  <AnimatedInput value={input} onChange={setInput} onSend={handleSend} onCancel={handleCancel} onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)} disabled={isLoading} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel} />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 px-4 md:px-6 space-y-2">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  images={msg.images}
                  attachedImages={msg.attachedImages}
                  attachedFiles={msg.attachedFiles}
                  isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                  isThinking={isThinking && i === messages.length - 1 && msg.role === "assistant" && !msg.content}
                  liked={msg.liked}
                  onLike={(liked) => handleLike(i, liked)}
                  onShare={msg.role === "assistant" && conversationId ? handleShare : undefined}
                />
              ))}
              {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
                <ThinkingLoader searchQuery={searchEnabled ? input : undefined} searchStatus={searchStatus} />
              )}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && <ThinkingLoader />}
              <div ref={messagesEndRef} />
            </div>
          )}

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
              <AnimatePresence>
                {chatMode !== "normal" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 backdrop-blur-md border border-primary/15 w-fit pointer-events-auto"
                    style={{ touchAction: "none" }}
                  >
                    <span className="text-xs text-primary font-medium">
                      {chatMode === "learning" ? "Learning" : chatMode === "deep-research" ? "Deep Research" : "Shopping"} Mode
                    </span>
                    <button onClick={() => { setChatMode("normal"); if (chatMode === "deep-research") setSearchEnabled(false); }} className="ml-1 p-0.5 rounded-full hover:bg-primary/15 transition-colors pointer-events-auto">
                      <X className="w-3 h-3 text-primary" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {renderAttachments()}

              <div className="relative">
                <AnimatePresence>
                  {plusMenuOpen && renderPlusMenu(window.innerWidth < 768)}
                </AnimatePresence>

                {!hasConversation && (
                  <div className="hidden md:flex justify-center mb-2">
                    <button
                      onClick={() => navigate("/pricing")}
                      className="px-3 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground bg-secondary/60 border border-border/50 transition-colors"
                    >
                      Free plan · <span className="text-foreground font-medium">Upgrade</span>
                    </button>
                  </div>
                )}
                <AnimatedInput value={input} onChange={setInput} onSend={handleSend} onCancel={handleCancel} onPlusClick={() => setPlusMenuOpen(!plusMenuOpen)} disabled={isLoading} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel} />
              </div>
            </div>
          </div>
        )}

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.xml,.doc,.docx" multiple />
        <input ref={cameraInputRef} type="file" className="hidden" onChange={handleCameraCapture} accept="image/*" capture="environment" />
        <input ref={imageInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" multiple />

        {/* Connectors Dialog */}
        <ConnectorsDialog
          open={connectorsOpen}
          onOpenChange={setConnectorsOpen}
          onNavigateIntegrations={() => navigate("/settings/integrations")}
        />

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={(open) => { setShareDialogOpen(open); if (!open) setGeneratedShareUrl(null); }}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[380px] p-0 gap-0 overflow-hidden rounded-2xl">
            <div className="px-4 pt-4 pb-3">
              <DialogHeader className="mb-0">
                <DialogTitle className="text-base font-semibold text-left">Share chat</DialogTitle>
                <DialogDescription className="text-xs text-left">Future messages aren't included</DialogDescription>
              </DialogHeader>
            </div>
            <div className="border-t border-border">
              <button
                onClick={() => { setShareMode("private"); setGeneratedShareUrl(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${shareMode === "private" ? "bg-accent/40" : "hover:bg-accent/20"}`}
              >
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Keep private</p>
                  <p className="text-[11px] text-muted-foreground">Only you have access</p>
                </div>
                {shareMode === "private" && <span className="text-primary shrink-0">✓</span>}
              </button>
              <div className="h-px bg-border mx-4" />
              <button
                onClick={() => setShareMode("public")}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${shareMode === "public" ? "bg-accent/40" : "hover:bg-accent/20"}`}
              >
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Create public link</p>
                  <p className="text-[11px] text-muted-foreground">Anyone with the link can view</p>
                </div>
                {shareMode === "public" && <span className="text-primary shrink-0">✓</span>}
              </button>
            </div>
            <div className="px-4 py-3 border-t border-border">
              {shareMode === "public" && generatedShareUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 overflow-hidden">
                  <span className="flex-1 text-[11px] text-muted-foreground truncate min-w-0 select-all">{generatedShareUrl}</span>
                  <button
                    onClick={handleCopyShareLink}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-accent/50 transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateShareLink}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    {shareMode === "public" ? "Create link" : "Save"}
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
          <DialogContent className="sm:max-w-sm gap-3">
            <DialogHeader>
              <DialogTitle className="text-lg">Rename chat</DialogTitle>
            </DialogHeader>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsRenaming(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
              <button onClick={handleRename} className="px-4 py-2 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">Save</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
