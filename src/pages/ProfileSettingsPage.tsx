import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Lock, Trash2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
        setUserEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, plan, display_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (profile) {
          setCredits(Number(profile.credits) || 0);
          setPlan(profile.plan || "free");
          if (profile.display_name) setUserName(profile.display_name);
          setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
        }
      }
    };
    loadUser();
  }, []);

  const initial = (userName || "U").charAt(0).toUpperCase();

  const ProfileContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
      <div className="flex flex-col items-center py-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover mb-3" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-3">
            {initial}
          </div>
        )}
        <p className="text-lg font-semibold text-foreground">{userName}</p>
        <p className="text-sm text-muted-foreground">{userEmail}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">{plan} Plan</span>
          <span className="text-xs text-muted-foreground">{credits.toFixed(2)} credits</span>
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={() => navigate("/settings/change-email")} className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-colors text-left">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Change Email</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </button>

        <button onClick={() => navigate("/settings/change-password")} className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-colors text-left">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your password</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/pricing")}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors text-left"
        >
          <Crown className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Upgrade to Premium</p>
            <p className="text-xs text-muted-foreground">Get more credits and features</p>
          </div>
        </button>

        <button onClick={() => navigate("/settings/delete-account")} className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-destructive/5 transition-colors text-left mt-4">
          <Trash2 className="w-5 h-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account</p>
          </div>
        </button>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Account" subtitle="Manage your profile and security">
        <ProfileContent />
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
          <h1 className="font-display text-lg font-bold text-foreground">Profile</h1>
        </div>
        <div className="px-4">
          <ProfileContent />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
