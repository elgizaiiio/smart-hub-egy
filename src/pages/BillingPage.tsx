import { ArrowLeft, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BillingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Billing</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-6">
          {/* Card */}
          <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">M</div>
                <span className="text-xs opacity-80 uppercase tracking-wider">MEGSY AI</span>
              </div>
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">PREMIUM</span>
            </div>
            <p className="text-[10px] opacity-70 uppercase tracking-wider">AVAILABLE BALANCE</p>
            <p className="text-3xl font-bold mt-1">0.00 <span className="text-sm font-normal opacity-80">MC</span></p>
            <div className="flex items-center justify-between mt-4">
              <div className="w-10 h-7 rounded bg-amber-400/80" />
              <span className="text-sm opacity-80 tracking-widest">MC</span>
            </div>
          </div>

          {/* Add Credits */}
          <button
            onClick={() => navigate("/pricing")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            + Add Credits
          </button>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TOTAL USED</p>
              <p className="text-xl font-bold text-foreground">0.00</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">GENERATIONS</p>
              <p className="text-xl font-bold text-foreground">0</p>
            </div>
          </div>

          {/* Usage History */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">USAGE HISTORY</p>
            <div className="text-center py-8">
              <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No usage history yet</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingPage;
