import { ArrowLeft, Copy, Check } from "lucide-react";
import FancyButton from "@/components/FancyButton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import referralHero from "@/assets/referral-hero.png";

interface Referral {
  id: string;
  referred_id: string;
  status: string;
  created_at: string;
}

interface Earning {
  id: string;
  amount: number;
  source_action: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  method: string;
  created_at: string;
}

const ReferralsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState<"referrals" | "earnings" | "withdrawals">("referrals");

  const referralLink = referralCode ? `https://megsyai.com/ref/${referralCode}` : "";

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get or create referral code
    const { data: codes } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .limit(1);

    if (codes && codes.length > 0) {
      setReferralCode(codes[0].code);
    } else {
      const code = `MEGSY-${user.id.substring(0, 6).toUpperCase()}`;
      await supabase.from("referral_codes").insert({ user_id: user.id, code });
      setReferralCode(code);
    }

    // Load referrals
    const { data: refs } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });
    if (refs) setReferrals(refs);

    // Load earnings
    const { data: earns } = await supabase
      .from("referral_earnings")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });
    if (earns) {
      setEarnings(earns);
      const total = earns.reduce((s: number, e: Earning) => s + Number(e.amount), 0);
      setTotalEarned(total);
    }

    // Load withdrawals
    const { data: wds } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (wds) {
      setWithdrawals(wds);
      const withdrawn = wds
        .filter((w: Withdrawal) => w.status !== "rejected")
        .reduce((s: number, w: Withdrawal) => s + Number(w.amount), 0);
      const total = earnings.reduce((s: number, e: Earning) => s + Number(e.amount), 0);
      setAvailableBalance(total - withdrawn);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Recalculate available balance when earnings/withdrawals change
  useEffect(() => {
    const total = earnings.reduce((s, e) => s + Number(e.amount), 0);
    const withdrawn = withdrawals
      .filter(w => w.status !== "rejected")
      .reduce((s, w) => s + Number(w.amount), 0);
    setTotalEarned(total);
    setAvailableBalance(total - withdrawn);
  }, [earnings, withdrawals]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > availableBalance) {
      toast.error("Invalid amount");
      return;
    }
    if (!paymentDetails.trim()) {
      toast.error("Enter payment details");
      return;
    }

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      amount: amt,
      method: paymentMethod,
      payment_details: paymentDetails,
    });

    if (error) {
      toast.error("Failed to submit withdrawal");
    } else {
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      setPaymentDetails("");
      setShowWithdraw(false);
      loadData();
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg mx-auto pb-12">
      {/* Hero Image */}
      <div className="rounded-2xl overflow-hidden">
        <img src={referralHero} alt="Megsy Referral Program" className="w-full h-auto object-cover" />
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">Referral Program</h2>
        <p className="text-sm text-muted-foreground">
          20% commission on every payment — forever
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Referrals", value: referrals.length.toString() },
          { label: "Total Earned", value: `$${totalEarned.toFixed(2)}` },
          { label: "Available", value: `$${availableBalance.toFixed(2)}` },
        ].map(stat => (
          <div key={stat.label} className="fancy-btn !p-0 !cursor-default" style={{ borderRadius: "1rem" }}>
            <span className="fold" />
            <div className="points_wrapper">
              {Array.from({ length: 8 }).map((_, i) => <span key={i} className="point" />)}
            </div>
            <div className="inner !flex-col !py-4 !px-2">
              <span className="text-xl font-bold">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Your Referral Link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground truncate select-all font-mono">
            {referralLink || "Loading..."}
          </div>
          <button
            onClick={handleCopy}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">How It Works</p>
        <div className="space-y-2">
          {[
            { step: "1", text: "Share your unique referral link with anyone" },
            { step: "2", text: "They sign up and make a purchase" },
            { step: "3", text: "You earn 20% of every payment they make, forever" },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {item.step}
              </div>
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Button */}
      <FancyButton onClick={() => setShowWithdraw(!showWithdraw)} className="w-full">
        {showWithdraw ? "Cancel" : "Request Withdrawal"}
      </FancyButton>

      {/* Withdraw Form */}
      {showWithdraw && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 p-4 rounded-2xl bg-card border border-border">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount ($)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder={`Max: $${availableBalance.toFixed(2)}`}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="paypal">PayPal</option>
              <option value="crypto">Crypto (USDT)</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {paymentMethod === "paypal" ? "PayPal Email" : paymentMethod === "crypto" ? "Wallet Address" : "Bank Details"}
            </label>
            <input
              type="text"
              value={paymentDetails}
              onChange={e => setPaymentDetails(e.target.value)}
              placeholder={paymentMethod === "paypal" ? "your@email.com" : paymentMethod === "crypto" ? "USDT TRC20 address" : "IBAN / Account number"}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <FancyButton onClick={handleWithdraw} className="w-full">
            Submit Withdrawal
          </FancyButton>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex bg-secondary rounded-full p-1">
        {(["referrals", "earnings", "withdrawals"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all capitalize ${
              activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2">
        {activeTab === "referrals" && (
          referrals.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No referrals yet. Share your link to get started.</p>
          ) : (
            referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">User {r.referred_id.substring(0, 8)}...</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  r.status === "active" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                }`}>
                  {r.status}
                </span>
              </div>
            ))
          )
        )}

        {activeTab === "earnings" && (
          earnings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No earnings yet.</p>
          ) : (
            earnings.map(e => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">${Number(e.amount).toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(e.created_at)}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{e.source_action}</span>
              </div>
            ))
          )
        )}

        {activeTab === "withdrawals" && (
          withdrawals.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No withdrawal requests yet.</p>
          ) : (
            withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">${Number(w.amount).toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">{w.method} — {formatDate(w.created_at)}</p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  w.status === "completed" ? "bg-green-500/10 text-green-500" :
                  w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-primary/10 text-primary"
                }`}>
                  {w.status}
                </span>
              </div>
            ))
          )
        )}
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
      <div className="max-w-lg mx-auto">
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
