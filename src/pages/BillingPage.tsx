import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
      {/* Balance */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {credits.toFixed(0)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">MC</p>
      </div>

      {/* Add MC */}
      <div className="flex justify-center">
        <FancyButton onClick={() => navigate("/pricing")}>
          Add MC
        </FancyButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted/40 p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Plan</span>
          <p className="text-sm font-semibold text-foreground mt-1">Free</p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Transactions</span>
          <p className="text-sm font-semibold text-foreground mt-1">{transactions.length}</p>
        </div>
      </div>

      {/* History */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</p>

        {transactions.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-muted/20">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your MC history will appear here</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
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
