import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const services = [
  { name: "Chat API", status: "operational" },
  { name: "Image Generation", status: "operational" },
  { name: "Video Generation", status: "operational" },
  { name: "File Processing", status: "operational" },
  { name: "Web Search", status: "operational" },
  { name: "Code Sandbox", status: "operational" },
  { name: "Authentication", status: "operational" },
  { name: "Database", status: "operational" },
];

const StatusPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Status</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-4">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">All systems operational</p>
              <p className="text-xs text-muted-foreground">Last updated: just now</p>
            </div>
          </div>

          <div className="space-y-1">
            {services.map(s => (
              <div key={s.name} className="flex items-center justify-between py-3 px-1">
                <span className="text-sm text-foreground">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground capitalize">{s.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Uptime bars */}
          <div className="pt-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">90-day uptime</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 90 }).map((_, i) => (
                <div key={i} className="flex-1 h-8 bg-success/60 rounded-sm" />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">90 days ago</span>
              <span className="text-[10px] text-muted-foreground">Today</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatusPage;
