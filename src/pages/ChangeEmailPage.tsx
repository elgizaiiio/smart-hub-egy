import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const ChangeEmailPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentEmail(user.email || "");
    });
  });

  const handleChangeEmail = async () => {
    if (!newEmail) { toast.error("Please enter an email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { toast.error("Please enter a valid email"); return; }
    if (newEmail === currentEmail) { toast.error("This is your current email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to both addresses");
      navigate("/settings/profile");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const Content = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Current Email</p>
        <p className="text-sm font-medium text-foreground">{currentEmail}</p>
        <p className="text-xs text-muted-foreground">
          A confirmation link will be sent to both your current and new email addresses
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">New Email</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="example@email.com"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={handleChangeEmail} disabled={loading} className="w-full rounded-xl">
          {loading ? "Sending..." : "Update Email"}
        </Button>
        <Button onClick={() => navigate("/settings/profile")} variant="outline" className="w-full rounded-xl">
          Cancel
        </Button>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Change Email" subtitle="Update your email address">
        <Content />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings/profile")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Change Email</h1>
        </div>
        <div className="px-4">
          <Content />
        </div>
      </div>
    </div>
  );
};

export default ChangeEmailPage;
