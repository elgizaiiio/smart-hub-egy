import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ChevronRight, Globe, Paintbrush, Zap, User, CreditCard,
  Gift, Code, Activity, Info, LogOut, Settings, Crown, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import { DesktopSettingsHome } from "@/components/DesktopSettingsHome";

const SettingsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("user@email.com");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
      setUserEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, plan, credits")
        .eq("id", user.id)
        .single();
      if (profile && !cancelled) {
        if (profile.display_name) setUserName(profile.display_name);
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
        setPlan(profile.plan || "free");
        setCredits(Number(profile.credits) || 0);
      }
    };
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Welcome" subtitle="Manage your account and preferences">
        <DesktopSettingsHome />
      </DesktopSettingsLayout>
    );
  }

  const initial = userName.charAt(0).toUpperCase();
  const isPremium = plan !== "free";

  const quickActions = [
    { icon: Paintbrush, label: "Theme", desc: "Colors & style", path: "/settings/customization", color: "bg-pink-500/10 text-pink-500" },
    { icon: Globe, label: "Language", desc: "App language", path: "/settings/language", color: "bg-sky-500/10 text-sky-500" },
    { icon: Zap, label: "Connect", desc: "Integrations", path: "/settings/integrations", color: "bg-amber-500/10 text-amber-500" },
  ];

  const menuItems = [
    { icon: User, label: "Account", desc: "Profile & security", path: "/settings/profile" },
    { icon: CreditCard, label: "Billing", desc: "Credits & payments", path: "/settings/billing" },
    { icon: Gift, label: "Referrals", desc: "Invite & earn 20%", path: "/settings/referrals" },
    { icon: Code, label: "APIs", desc: "Developer access", path: "/settings/apis" },
  ];

  const supportItems = [
    { icon: Activity, label: "System Status", path: "/status" },
    { icon: Info, label: "About Megsy", path: "/about" },
  ];

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h1 className="font-display text-base font-bold text-foreground">Settings</h1>
          </div>
          <div className="w-9" />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-4">
          {/* Profile Card */}
          <button
            onClick={() => navigate("/settings/profile")}
            className="w-full rounded-2xl p-4 mb-6 text-left transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))" }}
          >
            <div className="flex items-center gap-3.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {initial}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-base font-semibold text-foreground truncate">{userName}</p>
                  {isPremium && <Crown className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {Math.floor(credits)} credits
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider capitalize">
                    {plan} plan
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </div>
          </button>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl hover:bg-muted/40 transition-all active:scale-95"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Upgrade Banner */}
          {!isPremium && (
            <motion.button
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate("/pricing")}
              className="w-full mb-8 p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))" }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Upgrade to Premium</p>
                <p className="text-xs text-white/70">Unlock all AI features & unlimited access</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
            </motion.button>
          )}

          {/* Menu Items */}
          <div className="mb-6">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 px-1">Account & Billing</p>
            <div className="rounded-2xl overflow-hidden">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 py-3.5 px-1 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Support */}
          <div className="mb-6">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 px-1">Support</p>
            {supportItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-muted/30 transition-colors"
                >
                  <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                  <span className="flex-1 text-sm text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                </button>
              );
            })}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mb-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <p className="text-center text-[10px] text-muted-foreground/50 mb-4">Megsy AI v1.0</p>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
