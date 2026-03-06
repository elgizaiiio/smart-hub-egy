import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Globe, Paperclip, GraduationCap, ShoppingCart, Layers, Link2, Sparkles } from "lucide-react";
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
  liked?: boolean | null;
  id?: string;
}

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
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);
    setIsThinking(true);

    const convId = await createOrUpdateConversation(input);
    if (convId) await saveMessage(convId, "user", input);

    if (convId && messages.length === 0) {
      await supabase.from("conversations").update({
        title: input.slice(0, 50),
        updated_at: new Date().toISOString()
      }).eq("id", convId);
    }

    let assistantContent = "";
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const updateAssistant = (chunk: string) => {
      setIsThinking(false);
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    let searchContext = "";
    if (searchEnabled) {
      try {
        const searchQuery = input.replace(/@\w+\s*/g, "").trim();
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
        }
      } catch (e) { /* continue without search */ }
    }

    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    if (searchContext) {
      allMessages.push({ role: "user" as const, content: `[Search results]:\n${searchContext}\n\nUse these results to answer accurately.` });
    }

    await streamChat({
      messages: allMessages,
      model: selectedModel.id,
      onDelta: updateAssistant,
      onDone: async () => {
        setIsLoading(false);
        setIsThinking(false);
        if (convId && assistantContent) {
          await saveMessage(convId, "assistant", assistantContent);
          await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
        }
      },
      onError: (err) => { toast.error(err); setIsThinking(false); setIsLoading(false); },
      signal: controller.signal,
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
    setIsThinking(false);
    setAttachedFiles([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setAttachedFiles(prev => [...prev, { name: file.name, type: "file", data: text.slice(0, 5000) }]);
      setInput(prev => prev + `\n\nFile (${file.name}):\n${text.slice(0, 5000)}`);
    }
    e.target.value = "";
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={loadConversation}
        activeConversationId={conversationId}
        currentMode="chat"
      />

      {/* Header - minimal */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {!hasConversation && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={handleNewChat}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <FancyButton onClick={() => navigate("/pricing")}>
                Unlock Megsy Pro
              </FancyButton>
            </motion.div>
          )}
        </AnimatePresence>

        {hasConversation && (
          <button
            onClick={handleNewChat}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
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
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-2">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                images={msg.images}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                isThinking={isThinking && i === messages.length - 1 && msg.role === "assistant" && !msg.content}
                liked={msg.liked}
                onLike={(liked) => handleLike(i, liked)}
              />
            ))}
            {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
              <ThinkingLoader />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {searchEnabled && (
            <div className="flex items-center gap-2 px-3">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary">Web search enabled</span>
              <button onClick={() => setSearchEnabled(false)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
                Disable
              </button>
            </div>
          )}

          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 px-3 overflow-x-auto pb-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground border border-border">
                  {f.type === "image" ? (
                    <img src={f.data} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
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
                    className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-72"
                  >
                    <div className="space-y-0.5">
                      {/* Model selector */}
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase mb-2">Model</p>
                        <ModelSelector
                          mode="chat"
                          selectedModel={selectedModel}
                          onModelChange={(m) => { setSelectedModel(m); }}
                        />
                      </div>

                      <button
                        onClick={() => { setSearchEnabled(!searchEnabled); setPlusMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          searchEnabled ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        <div>
                          <p className="text-sm">Web Search</p>
                          <p className="text-[10px] text-muted-foreground">{searchEnabled ? "Enabled" : "Search the web"}</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">Attach File</p>
                          <p className="text-[10px] text-muted-foreground">Images or documents</p>
                        </div>
                      </button>

                      <div className="border-t border-border mt-1 pt-1">
                        <p className="text-[10px] text-muted-foreground uppercase px-3 py-1.5">Modes</p>
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Learning Mode</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors">
                          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Shopping Mode</span>
                        </button>
                      </div>

                      <div className="border-t border-border mt-1 pt-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors relative">
                          <Link2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">More Models</span>
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">PRO</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors relative">
                          <Layers className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Integrations</span>
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">PRO</span>
                        </button>
                      </div>
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
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css" />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
