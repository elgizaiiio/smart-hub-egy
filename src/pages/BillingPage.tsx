import { ArrowLeft, CreditCard, Download } from "lucide-react";
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
          {/* Current Plan */}
          <div className="p-4 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Free Plan</span>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">Current</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">0 credits remaining</p>
            <button onClick={() => navigate("/pricing")} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Upgrade Plan
            </button>
          </div>

          {/* Invoices */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Invoices</p>
            <div className="text-sm text-muted-foreground text-center py-8">
              No invoices yet
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingPage;
