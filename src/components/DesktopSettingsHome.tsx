import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const QuickAction = ({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all text-left group"
  >
    <p className="text-sm font-medium text-foreground mb-1">{title}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-2 group-hover:text-primary transition-colors" />
  </button>
);

export function DesktopSettingsHome() {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, plan")
        .eq("id", user.id)
        .single();
      if (profile) {
        if (profile.display_name) setUserName(profile.display_name);
        setAvatarUrl(
          profile.avatar_url || user.user_metadata?.avatar_url || null
        );
        setPlan(profile.plan || "free");
      }
    };
    load();
  }, []);

  const initial = userName.charAt(0).toUpperCase();
  const isPremium = plan !== "free";

  return (
    <div className="max-w-2xl space-y-8">
      {/* User Card */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{userName}</p>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
        <Button
          onClick={() => navigate("/settings/profile")}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          Edit Profile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">MC Balance</p>
          <p className="text-2xl font-bold text-foreground">
            {credits !== null ? credits.toFixed(2) : "..."}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Account Status</p>
          <div className="flex items-center gap-2 mt-1">
            {isPremium ? (
              <>
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold text-foreground capitalize">
                  {plan}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">Free</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            title="Add Credits"
            description="Top up your balance"
            onClick={() => navigate("/pricing")}
          />
          <QuickAction
            title="Customization"
            description="Themes & colors"
            onClick={() => navigate("/settings/customization")}
          />
          <QuickAction
            title="Referrals"
            description="Earn 20% commission"
            onClick={() => navigate("/settings/referrals")}
          />
        </div>
      </div>

      {/* Upgrade CTA */}
      {!isPremium && (
        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Upgrade to Premium</p>
            <p className="text-sm text-muted-foreground">
              Get unlimited access to all AI features
            </p>
          </div>
          <Button
            onClick={() => navigate("/pricing")}
            className="rounded-xl"
          >
            Upgrade Now
          </Button>
        </div>
      )}
    </div>
  );
}

export default DesktopSettingsHome;
