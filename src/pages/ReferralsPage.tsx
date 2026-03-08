import { ArrowLeft, Copy, Check, Gift, Users, DollarSign, Share2 } from "lucide-react";
import FancyButton from "@/components/FancyButton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import { toast } from "sonner";

const ReferralsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const referralCode = "MEGSY-USER123";
  const referralLink = `https://megsy.ai/ref/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join Megsy AI", text: "Try Megsy AI with my referral link!", url: referralLink });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-md mx-auto">
      {/* Hero */}
      <div className="flex flex-col items-center py-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Invite & Earn</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Share Megsy with friends and earn <span className="text-primary font-semibold">20% commission</span> on every payment they make
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center">
        <div className="flex-1 py-3 text-center">
          <Users className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Referrals</p>
        </div>
        <div className="w-px h-12 bg-border" />
        <div className="flex-1 py-3 text-center">
          <DollarSign className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">$0.00</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Earned</p>
        </div>
      </div>

      {/* Referral Link */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">YOUR REFERRAL LINK</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-xl bg-muted/50 text-sm text-foreground truncate select-all">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <FancyButton onClick={handleShare} className="w-full mt-3">
          <Share2 className="w-4 h-4" /> Share Link
        </FancyButton>
      </div>

      {/* How it works */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">HOW IT WORKS</p>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your link", desc: "Send your referral link to friends" },
            { step: "2", title: "They sign up", desc: "Your friend creates an account & makes a purchase" },
            { step: "3", title: "You earn", desc: "Get 20% of every payment they make" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Referrals" subtitle="Earn commission by inviting friends">
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
          <h1 className="font-display text-lg font-bold text-foreground">Referrals</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default ReferralsPage;
