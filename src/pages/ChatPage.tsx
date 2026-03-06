import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import ChatMessage from "@/components/ChatMessage";
import AnimatedInput from "@/components/AnimatedInput";
import ModeSelector from "@/components/ModeSelector";
import ModelSelector, { getDefaultModel } from "@/components/ModelSelector";
import AgentMenu from "@/components/AgentMenu";
import ThinkingLoader from "@/components/ThinkingLoader";
import { streamChat } from "@/lib/streamChat";

type Mode = "chat" | "code" | "files" | "images" | "videos";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  liked?: boolean | null;
  id?: string;
}

const ChatPage = () => {
  const [mode, setMode] = useState<Mode>("chat");
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("chat"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [agentFilter, setAgentFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const agentsList = [
    { id: "deep-research", label: "Deep Research" },
    { id: "education", label: "Education" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSelectedModel(getDefaultModel(newMode));
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    // Check for @ mentions
    const lastAt = val.lastIndexOf("@");
    if (lastAt >= 0 && lastAt === val.length - 1 || (lastAt >= 0 && !val.slice(lastAt).includes(" "))) {
      setAgentFilter(val.slice(lastAt + 1));
      setShowAgentDropdown(true);
    } else {
      setShowAgentDropdown(false);
    }
  };

  const selectAgentFromDropdown = (agent: { id: string; label: string }) => {
    const lastAt = input.lastIndexOf("@");
    setInput(input.slice(0, lastAt) + `@${agent.id} `);
    setShowAgentDropdown(false);
  };

  const createOrUpdateConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const title = firstMessage.slice(0, 50) || "New Chat";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode, model: selectedModel.id })
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
    const msg = messages[index];
    if (msg.id) {
      await supabase.from("messages").update({ liked }).eq("id", msg.id);
    }
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    const { data: conv } = await supabase.from("conversations").select("*").eq("id", id).single();
    if (conv) {
      setMode(conv.mode as Mode);
      if (conv.model) {
        setSelectedModel({ id: conv.model, name: conv.model, credits: "Free" });
      }
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setInput(prev => prev + `\n[Attached image: ${file.name}]`);
        // Store in a temp ref or state for sending
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setInput(prev => prev + `\n\nFile content (${file.name}):\n${text.slice(0, 5000)}`);
    }
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    const convId = await createOrUpdateConversation(input);
    if (convId) await saveMessage(convId, "user", input);

    // Update conversation title
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
      if (isThinking) setIsThinking(false);
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    // Check if we need search
    const needsSearch = input.includes("@deep-research") || 
      /(?:ابحث|بحث|search|find|ما هو|من هو|what is|who is|أخبار|news)/i.test(input);

    let searchContext = "";
    if (needsSearch) {
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
          // If there are images from search, they'll be in the AI response
        }
      } catch (e) {
        // Search failed, continue without
      }
    }

    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    if (searchContext) {
      allMessages.push({ role: "user" as const, content: `[Search results for context]:\n${searchContext}\n\nPlease use these search results to answer. Include relevant image URLs in markdown format.` });
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
      onError: (err) => { toast.error(err); setIsThinking(false); },
      signal: controller.signal,
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
    setIsThinking(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={loadConversation}
        activeConversationId={conversationId}
      />

      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-lg"
            >
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-foreground">
                Hey, what's up?
              </h2>
              <ModeSelector activeMode={mode} onModeChange={handleModeChange} />
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-2 pt-14">
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

      <div className="shrink-0 px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <ModelSelector mode={mode} selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <div className="relative">
            {/* Agent @ dropdown */}
            {showAgentDropdown && (
              <div className="absolute bottom-full mb-2 left-12 z-40 glass-panel p-1 min-w-[180px]">
                {agentsList
                  .filter(a => a.label.toLowerCase().includes(agentFilter.toLowerCase()) || a.id.includes(agentFilter.toLowerCase()))
                  .map(a => (
                    <button
                      key={a.id}
                      onClick={() => selectAgentFromDropdown(a)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      @{a.id} — {a.label}
                    </button>
                  ))
                }
              </div>
            )}
            <AgentMenu
              open={agentMenuOpen}
              onClose={() => setAgentMenuOpen(false)}
              onSelectAgent={(id) => {
                if (id === "deep-research") setInput("@deep-research ");
                else if (id === "education") setInput("@education ");
              }}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            />
            <AnimatedInput
              value={input}
              onChange={handleInputChange}
              onSend={handleSend}
              onCancel={handleCancel}
              onPlusClick={() => setAgentMenuOpen(!agentMenuOpen)}
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
