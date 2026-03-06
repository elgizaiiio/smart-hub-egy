import { useState } from "react";
import { Menu, MessageSquare, Eye, Plus, Paperclip, ArrowUp, Square } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";

const CodeWorkspace = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "user", content: prompt },
    { role: "assistant", content: `I'll build "${prompt}" for you.\n\n📁 Creating project structure...\n📝 Writing index.html\n📝 Writing styles.css\n📝 Writing app.js\n\n✅ Project created successfully! Switch to Preview to see the result.` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} />

      {/* Header with integrations */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">
            Supabase
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="shrink-0 px-4 py-3 max-w-3xl mx-auto w-full">
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <button className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your project..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
                  style={{ minHeight: "32px" }}
                />
                <button disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-secondary">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Preview will appear here</p>
              <p className="text-xs text-muted-foreground mt-1">Your project is being built...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom tabs */}
      <div className="flex border-t border-border">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === "chat" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === "preview" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>
    </div>
  );
};

export default CodeWorkspace;
