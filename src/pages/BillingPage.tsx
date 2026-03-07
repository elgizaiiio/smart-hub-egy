import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Coins, ReceiptText, PlusCircle } from "lucide-react";
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
      {/* Balance Hero */}
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Coins className="w-7 h-7 text-primary" />
        </div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-foreground">{credits.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">credits &middot; 1 credit = $0.10</p>
      </div>

      {/* Add Credits */}
      <button
        onClick={() => navigate("/pricing")}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" />
        Add Credits
      </button>

      {/* Transaction History */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">History</p>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <ReceiptText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your credit usage will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const isDeduction = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3 px-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDeduction ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                    {isDeduction
                      ? <ArrowUpRight className="w-4 h-4 text-red-500" />
                      : <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description || tx.action_type}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums shrink-0 ${isDeduction ? "text-red-500" : "text-emerald-500"}`}>
                    {isDeduction ? "-" : "+"}{tx.amount}
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
