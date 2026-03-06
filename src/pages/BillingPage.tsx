import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Plus as PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const BillingPage = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
        if (profile) setCredits(Number(profile.credits) || 0);
      }
    };
    load();
  }, []);

  const mockHistory = [
    { type: "add", amount: 10, desc: "Welcome bonus", date: "Today" },
  ];

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
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm" style={{ background: "linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0)", color: "#333", WebkitBackgroundClip: "text" }}>
                  <span className="text-lg font-black" style={{ background: "linear-gradient(135deg, #c0c0c0, #ffffff, #a0a0a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>M</span>
                </div>
                <span className="text-xs opacity-80 uppercase tracking-wider">MEGSY AI</span>
              </div>
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">PREMIUM</span>
            </div>
            <p className="text-[10px] opacity-70 uppercase tracking-wider">AVAILABLE BALANCE</p>
            <p className="text-3xl font-bold mt-1">{credits.toFixed(2)} <span className="text-sm font-normal opacity-80">MC</span></p>
            <div className="flex items-center justify-between mt-4">
              <div className="w-10 h-7 rounded bg-gradient-to-r from-amber-300 to-amber-500" />
              <span className="text-sm opacity-80 tracking-widest">MC</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Add Credits
          </button>

          {/* Usage History */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">CREDIT HISTORY</p>
            {mockHistory.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mockHistory.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === "add" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {item.type === "add" ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.desc}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <span className={`text-sm font-medium ${item.type === "add" ? "text-green-500" : "text-red-500"}`}>
                      {item.type === "add" ? "+" : "-"}{item.amount} MC
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingPage;
