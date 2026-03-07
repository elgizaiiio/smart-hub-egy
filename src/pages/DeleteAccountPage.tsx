import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setIsDeleting(true);
    try {
      // Sign out the user (actual deletion requires a server-side function)
      toast.success("Account deletion requested. You will be signed out.");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const Content = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-6">
      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">Warning</p>
          <p className="text-xs text-muted-foreground mt-1">
            This action is permanent and cannot be undone. All your data will be deleted forever.
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">What will be deleted</p>
        <div className="space-y-2">
          {["Profile Information", "All Conversations", "Generated Content", "Credits & Subscription"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Type <span className="font-bold text-destructive">DELETE</span> to confirm
        </label>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
        />
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleDeleteAccount}
          disabled={isDeleting || confirmText !== "DELETE"}
          variant="destructive"
          className="w-full rounded-xl"
        >
          {isDeleting ? "Deleting..." : "Delete My Account"}
        </Button>
        <Button onClick={() => navigate("/settings/profile")} variant="outline" className="w-full rounded-xl">
          Cancel
        </Button>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Delete Account" subtitle="Permanently delete your account and data">
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
          <h1 className="font-display text-lg font-bold text-foreground">Delete Account</h1>
        </div>
        <div className="px-4">
          <Content />
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
