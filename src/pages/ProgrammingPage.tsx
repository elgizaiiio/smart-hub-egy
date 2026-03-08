import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, ArrowUp, Globe, Code2, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import FancyButton from "@/components/FancyButton";
import { supabase } from "@/integrations/supabase/client";

const TEMPLATES = [
  { label: "Personal website", icon: Globe },
  { label: "E-commerce", icon: Globe },
  { label: "Dashboard", icon: Globe },
  { label: "Mobile app", icon: Globe },
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
    // Navigate to workspace with the conversation
    navigate(`/code/workspace?conversation_id=${id}`);
  };

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={() => setConversationId(null)} activeConversationId={conversationId}>
    <div className="h-full flex flex-col bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => { setConversationId(null); }}
        onSelectConversation={loadConversation}
        activeConversationId={conversationId}
        currentMode="code"
      />

      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <FancyButton onClick={() => navigate("/pricing")}>
          Unlock Pro
        </FancyButton>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl w-full"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">What do you want to build?</h2>
          <p className="text-sm text-muted-foreground mb-8">Describe your idea and AI will create it for you</p>

          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to build?"
                rows={3}
                className="w-full bg-transparent backdrop-blur-md border border-primary/30 rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setInput(t.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                {t.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Projects Grid */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-2xl mt-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Projects</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => openProject(project)}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all text-left"
                >
                  {/* Preview thumbnail */}
                  <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    {project.preview_url ? (
                      <img
                        src={project.preview_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Code2 className="w-8 h-8 text-muted-foreground/40" />
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
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    project.status === "ready" ? "bg-green-500" : project.status === "building" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground/30"
                  }`} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProgrammingPage;
