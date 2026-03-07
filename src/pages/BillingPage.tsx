import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Sparkles, Receipt, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import FancyButton from "@/components/FancyButton";

const BillingPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
        if (profile) setCredits(Number(profile.credits) || 0);

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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-md mx-auto">
      {/* Balance Section */}
      <div className="text-center pt-4 pb-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {credits.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">credits · 1 credit = $0.10</p>
      </div>

      {/* Add Credits Button - FancyButton like chat */}
      <div className="flex justify-center">
        <FancyButton onClick={() => navigate("/pricing")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
          Add Credits
        </FancyButton>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Plan</span>
          </div>
          <p className="text-sm font-semibold text-foreground">Free</p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Transactions</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{transactions.length}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Recent Activity</p>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-muted/20">
            <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your credit history will appear here</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {isCredit
                      ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      : <ArrowUpRight className="w-4 h-4 text-red-500" />
                    }
                  </div>
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
      <DesktopSettingsLayout title="Billing" subtitle="Manage your credits and view transaction history">
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
