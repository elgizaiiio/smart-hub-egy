import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center px-4 md:px-6 h-14 border-b border-border">
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-lg text-foreground">Profile</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header - Instagram style */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-background">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-foreground">John Doe</h2>
              <p className="text-sm text-muted-foreground">john@example.com</p>
            </div>
          </div>

          {/* Credits bar */}
          <div className="glass-panel p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground font-medium">Credits</span>
              <span className="text-sm text-muted-foreground">1,847 / 2,000</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-foreground/70 rounded-full" style={{ width: "92%" }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div>
              <p className="font-display text-xl font-bold text-foreground">24</p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground">153</p>
              <p className="text-xs text-muted-foreground">Chats</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setActiveTab("images")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "images" ? "text-foreground border-foreground" : "text-muted-foreground border-transparent"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "videos" ? "text-foreground border-foreground" : "text-muted-foreground border-transparent"
              }`}
            >
              Videos
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-1">
            <div className="col-span-3 flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-sm">No {activeTab} yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your generated {activeTab} will appear here</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
