import { ArrowLeft, Copy, Check, Users, DollarSign, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const ReferralsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const referralCode = "MEGSY-USER123";
  const referralLink = `https://megsy.ai/ref/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ReferralsContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
      <div className="text-center py-6 rounded-2xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))" }}>
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Earn 20% commission</h2>
        <p className="text-sm text-muted-foreground px-4">Share Megsy and earn 20% of every payment your referrals make</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 rounded-xl bg-accent/30">
          <Users className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="font-display text-xl font-bold text-foreground">0</p>
          <p className="text-[10px] text-muted-foreground">Referrals</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-accent/30">
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="font-display text-xl font-bold text-foreground">$0</p>
          <p className="text-[10px] text-muted-foreground">Earned</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-accent/30">
          <Percent className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="font-display text-xl font-bold text-foreground">20%</p>
          <p className="text-[10px] text-muted-foreground">Commission</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-accent/20">
        <p className="text-xs text-muted-foreground mb-2">Your referral link</p>
        <div className="flex items-center gap-2">
          <input value={referralLink} readOnly className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none" />
          <button onClick={handleCopy} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">How it works</p>
        <div className="space-y-3">
          {[
            { step: "1", text: "Share your referral link with friends" },
            { step: "2", text: "They sign up and make a purchase" },
            { step: "3", text: "You earn 20% of their payment" },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {item.step}
              </div>
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Referrals" subtitle="Earn commission by inviting friends">
        <ReferralsContent />
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
          <h1 className="font-display text-lg font-bold text-foreground">Referrals</h1>
        </div>
        <div className="px-4">
          <ReferralsContent />
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
