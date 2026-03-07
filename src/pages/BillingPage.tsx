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
  { type: "add", amount: 10, desc: "Welcome bonus", date: "Today" }];


  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Billing</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-6">
          {/* Balance Card */}
          <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))" }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black opacity-80">M</span>
                <span className="text-xs opacity-60 uppercase tracking-wider">MEGSY AI</span>
              </div>
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">PREMIUM</span>
            </div>
            <p className="text-[10px] opacity-60 uppercase tracking-wider">AVAILABLE BALANCE</p>
            <p className="text-3xl font-bold mt-1">{credits.toFixed(2)} <span className="text-sm font-normal opacity-60">credits</span></p>
            <div className="flex items-center justify-between mt-6">
              <div className="w-10 h-7 rounded bg-gradient-to-r from-amber-300 to-amber-500" />
              <span className="text-[10px] opacity-50">1 credit = $0.10</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            
             Add Credits
          </button>

          {/* Usage History */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">CREDIT HISTORY</p>
            {mockHistory.length === 0 ?
            <div className="text-center py-8">
                <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No history yet</p>
              </div> :

            <div className="space-y-2">
                {mockHistory.map((item, i) =>
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === "add" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {item.type === "add" ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.desc}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <span className={`text-sm font-medium ${item.type === "add" ? "text-green-500" : "text-red-500"}`}>
                      {item.type === "add" ? "+" : "-"}{item.amount} credits
                    </span>
                  </div>
              )}
              </div>
            }
          </div>
        </motion.div>
      </div>
    </div>);

};

export default BillingPage;