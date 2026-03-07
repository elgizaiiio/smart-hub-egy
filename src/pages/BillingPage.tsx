import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Plus as PlusIcon, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

interface Transaction {
  id: string;
  amount: number;
  action_type: string;
  description: string | null;
  created_at: string;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const BillingPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("credits").eq("id", user.id).single(),
        supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);

      if (cancelled) return;
      if (profileRes.data) setCredits(Number(profileRes.data.credits) || 0);
      if (txRes.data) setTransactions(txRes.data);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
      {/* Credit Card */}
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
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <PlusIcon className="w-4 h-4" /> Add Credits
      </button>

      {/* Transaction History */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">CREDIT HISTORY</p>
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your credit usage will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const isDeduction = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDeduction ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                    {isDeduction
                      ? <TrendingDown className="w-4 h-4 text-red-500" />
                      : <TrendingUp className="w-4 h-4 text-emerald-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description || tx.action_type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${isDeduction ? "text-red-500" : "text-emerald-500"}`}>
                    {isDeduction ? "-" : "+"}{tx.amount} credits
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
      <DesktopSettingsLayout title="Billing" subtitle="Manage your credits and payment">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
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
