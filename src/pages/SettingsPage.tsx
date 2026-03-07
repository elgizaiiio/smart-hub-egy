import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Globe, Paintbrush, Zap, User, CreditCard, Gift, Code, Activity, Info, LogOut } from "lucide-react";
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

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUserName(displayName);
        setUserEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (profile) {
          if (profile.display_name) setUserName(profile.display_name);
          setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
        }
      }
    };
    loadUser();
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

  const sections = [
    {
      title: "PREFERENCES",
      items: [
        { icon: Globe, label: "Language", path: "/settings/language" },
        { icon: Paintbrush, label: "Customization", path: "/settings/customization" },
      ],
    },
    {
      title: "AGENT & INTEGRATIONS",
      items: [
        { icon: Zap, label: "Agent Connections", path: "/settings/integrations" },
      ],
    },
    {
      title: "ACCOUNT & BILLING",
      items: [
        { icon: User, label: "Account", path: "/settings/profile" },
        { icon: CreditCard, label: "Billing", path: "/settings/billing" },
        { icon: Gift, label: "Referrals", path: "/settings/referrals" },
        { icon: Code, label: "APIs", path: "/settings/apis" },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { icon: Activity, label: "Status Page", path: "/status" },
        { icon: Info, label: "About", path: "/about" },
      ],
    },
  ];

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Settings</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4">
          {/* User Profile Card */}
          <button
            onClick={() => navigate("/settings/profile")}
            className="w-full flex items-center gap-3 py-4 mb-2"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {initial}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.title} className="mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider py-3">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 py-3.5 text-left"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-sm text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </button>
                );
              })}
            </div>
          ))}

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3.5 text-left mt-4 mb-8"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="flex-1 text-sm text-destructive font-medium">Sign Out</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
