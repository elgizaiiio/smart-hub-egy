import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import ChatMessage from "@/components/ChatMessage";
import AnimatedInput from "@/components/AnimatedInput";
import ModeSelector from "@/components/ModeSelector";
import ModelSelector, { getDefaultModel } from "@/components/ModelSelector";
import AgentMenu from "@/components/AgentMenu";
import { streamChat } from "@/lib/streamChat";

type Mode = "chat" | "code" | "files" | "images" | "videos";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatPage = () => {
  const [mode, setMode] = useState<Mode>("chat");
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("chat"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSelectedModel(getDefaultModel(newMode));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      model: selectedModel.id,
      onDelta: updateAssistant,
      onDone: () => setIsLoading(false),
      onError: (err) => toast.error(err),
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => setMessages([])} />

      {/* Minimal header - just sidebar toggle */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
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
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6 pt-14">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <ModelSelector mode={mode} selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <div className="relative">
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
              onChange={setInput}
              onSend={handleSend}
              onPlusClick={() => setAgentMenuOpen(!agentMenuOpen)}
              disabled={isLoading}
            />
          </div>
          <input ref={fileInputRef} type="file" className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
