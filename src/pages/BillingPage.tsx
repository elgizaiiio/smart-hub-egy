import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import visaBg from "@/assets/visa-bg.png";

const BillingPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("Free");
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("credits, plan").eq("id", user.id).single();
        if (profile) {
          setCredits(Number(profile.credits) || 0);
          setPlan(profile.plan || "Free");
        }
        const { data: txns } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (txns) setTransactions(txns);
      }
    };
    load();
  }, []);

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-md mx-auto">
      {/* Visa Card */}
      <div className="relative w-full aspect-[1.7/1] rounded-2xl overflow-hidden shadow-2xl">
        <img src={visaBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between h-full p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-medium">Balance</p>
              <p className="text-white text-4xl font-bold tracking-tight mt-1">
                {credits.toFixed(0)} <span className="text-lg font-normal text-white/70">MC</span>
              </p>
            </div>
            <div className="w-8" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                Megsy
              </p>
            </div>
            <div className="flex gap-[-8px]">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm" />
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm -ml-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/pricing")}
          className="fancy-btn !rounded-xl !py-3"
        >
          <span className="fold" />
          <div className="points_wrapper">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} className="point" />)}
          </div>
          <span className="inner text-sm">Add MC</span>
        </button>
        <button
          onClick={() => navigate("/settings/referrals")}
          className="py-3 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-muted/50 transition-colors"
        >
          Referrals
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center py-3">
          <p className="text-2xl font-bold text-foreground">{credits.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">MC Left</p>
        </div>
        <div className="text-center py-3">
          <p className="text-2xl font-bold text-foreground capitalize">{plan}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Plan</p>
        </div>
        <div className="text-center py-3">
          <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Transactions</p>
        </div>
      </div>

      {/* History */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</p>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your MC history will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3 px-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description || tx.action_type}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${isCredit ? "text-emerald-500" : "text-red-500"}`}>
                    {isCredit ? "+" : ""}{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Billing" subtitle="Manage your MC and view transaction history">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-12">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Billing</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default BillingPage;
