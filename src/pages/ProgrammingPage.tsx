import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, ArrowUp, Globe, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";

const TEMPLATES = [
  { label: "Personal website", icon: Globe },
  { label: "E-commerce", icon: Globe },
  { label: "Dashboard", icon: Globe },
  { label: "Mobile app", icon: Globe },
];

const ProgrammingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleSend = () => {
    if (!input.trim()) return;
    // Navigate to code workspace with the prompt
    navigate(`/code/workspace?prompt=${encodeURIComponent(input)}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => {}} />

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg w-full"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">What do you want to build?</h2>
          <p className="text-sm text-muted-foreground mb-8">Describe your idea and AI will create it for you</p>

          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="What do you want to build?"
                rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
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
                <t.icon className="w-4 h-4" />
                {t.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgrammingPage;
