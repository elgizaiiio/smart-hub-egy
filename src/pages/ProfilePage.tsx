import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Camera, CreditCard, BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("John Doe");
  const [email] = useState("john@example.com");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={logo} alt="egy" className="w-7 h-7" />
          <span className="font-display font-bold text-lg text-foreground">Profile</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Avatar */}
          <div className="glass-panel p-6 flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-silver flex items-center justify-center text-background">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          {/* Info */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Account Details</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full pl-10" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={email} disabled className="glass-input w-full pl-10 opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <button className="silver-button mt-2">Save Changes</button>
          </div>

          {/* Usage */}
          <div className="glass-panel p-6">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Usage Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Credits Left</span>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">1,847</p>
                <p className="text-xs text-muted-foreground mt-1">of 2,000</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs">This Month</span>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">153</p>
                <p className="text-xs text-muted-foreground mt-1">credits used</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
