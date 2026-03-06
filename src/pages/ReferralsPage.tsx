import { ArrowLeft, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const ReferralsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const referralCode = "MEGSY-USER123";
  const referralLink = `https://megsy.ai/ref/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Referrals</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-6">
          <div className="text-center py-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Earn 20% commission</h2>
            <p className="text-sm text-muted-foreground">Share Megsy and earn 20% of every payment your referrals make</p>
          </div>

          <div className="p-4 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-2">Your referral link</p>
            <div className="flex items-center gap-2">
              <input value={referralLink} readOnly className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none" />
              <button onClick={handleCopy} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl border border-border">
              <p className="font-display text-xl font-bold text-foreground">0</p>
              <p className="text-[10px] text-muted-foreground">Referrals</p>
            </div>
            <div className="text-center p-3 rounded-xl border border-border">
              <p className="font-display text-xl font-bold text-foreground">$0</p>
              <p className="text-[10px] text-muted-foreground">Earned</p>
            </div>
            <div className="text-center p-3 rounded-xl border border-border">
              <p className="font-display text-xl font-bold text-foreground">20%</p>
              <p className="text-[10px] text-muted-foreground">Commission</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReferralsPage;
