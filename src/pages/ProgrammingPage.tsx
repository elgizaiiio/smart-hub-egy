import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ArrowUp, Code2, FolderOpen, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import FancyButton from "@/components/FancyButton";
import { supabase } from "@/integrations/supabase/client";

const TEMPLATES = [
  "Personal website",
  "E-commerce store",
  "Dashboard app",
  "Mobile app",
  "SaaS platform",
  "Portfolio",
];

const HERO_WORDS = [
  { top: "BUILD YOUR", bottom: "VISION" },
  { top: "CODE YOUR", bottom: "FUTURE" },
  { top: "CREATE YOUR", bottom: "APP" },
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
  const [heroIdx, setHeroIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(p => (p + 1) % HERO_WORDS.length), 4000);
    return () => clearInterval(t);
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const hero = HERO_WORDS[heroIdx];

  return (
    <AppLayout onSelectConversation={loadConversation} onNewChat={() => setConversationId(null)} activeConversationId={conversationId}>
      <div className="h-full flex flex-col bg-background">
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={() => setConversationId(null)}
          onSelectConversation={loadConversation}
          activeConversationId={conversationId}
          currentMode="code"
        />

        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <FancyButton onClick={() => navigate("/pricing")}>Unlock Pro</FancyButton>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8">
          {/* Hero - Landing style */}
          <div className="text-center max-w-2xl w-full mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-display text-[7vw] md:text-[3.5vw] uppercase leading-[1.1] tracking-tight text-foreground">
                  {hero.top}
                </h1>
                <h1 className="font-display text-[9vw] md:text-[4.5vw] uppercase leading-[1] tracking-tight text-primary">
                  {hero.bottom}
                </h1>
              </motion.div>
            </AnimatePresence>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-sm text-muted-foreground max-w-md mx-auto"
            >
              Describe your idea and AI will build it for you in seconds.
            </motion.p>
          </div>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-lg mx-auto"
          >
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Describe your project..."
                rows={3}
                className="w-full bg-transparent backdrop-blur-md border border-primary/30 rounded-2xl px-4 py-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-20"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Templates */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                onClick={() => setInput(t)}
                className="px-4 py-2 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                {t}
              </motion.button>
            ))}
          </div>

          {/* Projects Grid */}
          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-2xl mt-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Projects</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((project, i) => (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    onClick={() => openProject(project)}
                    className="group flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {project.preview_url ? (
                        <img src={project.preview_url} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <Code2 className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{project.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <p className="text-[11px] text-muted-foreground">{formatDate(project.updated_at)}</p>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          project.status === "running" ? "bg-green-500" : project.status === "building" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground/30"
                        }`} />
                      </div>
                    </div>
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
