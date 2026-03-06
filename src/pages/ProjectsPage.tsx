import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center px-4 md:px-6 h-14 border-b border-border">
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-lg text-foreground">Projects</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Your Projects</h2>
          <p className="text-sm text-muted-foreground mb-8">Code projects you've created</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Empty state */}
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">No projects yet</p>
              <p className="text-muted-foreground text-xs mt-1">Start coding to see your projects here</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectsPage;
