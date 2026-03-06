import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ProfileSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Profile</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-6">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-3">
              U
            </div>
            <button className="text-sm text-primary">Change Photo</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Display Name</label>
              <input className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" defaultValue="User" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <input className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground outline-none" defaultValue="user@email.com" disabled />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bio</label>
              <textarea className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none" rows={3} placeholder="Tell us about yourself..." />
            </div>
            <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
