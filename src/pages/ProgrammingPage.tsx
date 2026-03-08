import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, ArrowUp, Globe, Code2, FolderOpen, ShoppingCart, BarChart3, Smartphone, Gamepad2, Layout, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import FancyButton from "@/components/FancyButton";
import { supabase } from "@/integrations/supabase/client";

const TEMPLATES = [
  { label: "Personal website", desc: "Portfolio & landing page", icon: Globe },
  { label: "E-commerce", desc: "Online store with cart", icon: ShoppingCart },
  { label: "Dashboard", desc: "Analytics & data viz", icon: BarChart3 },
  { label: "Mobile app", desc: "Responsive PWA", icon: Smartphone },
  { label: "Game", desc: "Interactive web game", icon: Gamepad2 },
  { label: "Admin panel", desc: "CRUD & management", icon: Layout },
];

interface Project {
  id: string;
  name: string;
  preview_url: string | null;
  status: string;
  updated_at: string;
  conversation_id: string | null;
}

const ProgrammingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("projects")
      .select("id, name, preview_url, status, updated_at, conversation_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setProjects(data);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    navigate(`/code/workspace?prompt=${encodeURIComponent(input)}`);
  };

  const openProject = (project: Project) => {
    const params = new URLSearchParams();
    params.set("project_id", project.id);
    if (project.conversation_id) params.set("conversation_id", project.conversation_id);
    navigate(`/code/workspace?${params.toString()}`);
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    navigate(`/code/workspace?conversation_id=${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={() => setConversationId(null)} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        {/* Radial gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={() => setConversationId(null)}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="code"
        />

        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <FancyButton onClick={() => navigate("/pricing")}>
            Unlock Pro
          </FancyButton>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 sm:px-6 py-8 md:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-2xl w-full"
          >


            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              What do you want to build?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8">
              Describe your idea and AI will create it for you
            </p>

            {/* Input area */}
            <div className="w-full max-w-lg mx-auto">
              <div
                className={`relative rounded-2xl border transition-all duration-300 bg-card/50 backdrop-blur-md ${
                  isFocused
                    ? "border-primary/50 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]"
                    : "border-border/60 hover:border-border"
                }`}
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your project idea..."
                  rows={4}
                  className="w-full bg-transparent rounded-2xl px-4 py-4 pr-14 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:opacity-20 disabled:hover:scale-100"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 max-w-lg mx-auto">
              {TEMPLATES.map((t, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  onClick={() => setInput(t.label)}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-card/30 backdrop-blur-sm text-center hover:border-primary/30 hover:bg-card/60 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <t.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{t.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Projects Grid */}
          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-2xl mt-14"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Projects</h3>
                </div>
                <button
                  onClick={() => {
                    setInput("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Project
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, i) => (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    onClick={() => openProject(project)}
                    className="group relative rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:shadow-[0_0_24px_-8px_hsl(var(--primary)/0.15)] transition-all duration-300 text-left"
                  >
                    {/* Preview thumbnail */}
                    <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                      {project.preview_url ? (
                        <img
                          src={project.preview_url}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Code2 className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-medium text-card-foreground truncate">{project.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(project.updated_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    {/* Status dot */}
                    <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-background ${
                      project.status === "ready" ? "bg-green-500" : project.status === "building" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground/30"
                    }`} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProgrammingPage;
