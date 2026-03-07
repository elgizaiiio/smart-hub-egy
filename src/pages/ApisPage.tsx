import { useState } from "react";
import { ArrowLeft, Plus, Copy, Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
}

const ApisPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showLanding, setShowLanding] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createKey = () => {
    if (!newKeyName.trim()) return;
    const key: ApiKey = {
      id: Math.random().toString(36).slice(2),
      name: newKeyName,
      key: `mk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      created: new Date().toISOString().split("T")[0],
    };
    setKeys(prev => [...prev, key]);
    setNewKeyName("");
    setShowCreate(false);
  };

  const ApiKeysContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-lg">
      <button onClick={() => setShowCreate(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
        <Plus className="w-4 h-4" /> Create new key
      </button>

      {showCreate && (
        <div className="p-4 rounded-xl border border-border space-y-3">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name..."
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none"
          />
          <div className="flex gap-2">
            <button onClick={createKey} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {keys.map(k => (
        <div key={k.id} className="p-3 rounded-xl border border-border flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{k.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{k.key.slice(0, 12)}...</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(k.key); setCopiedId(k.id); setTimeout(() => setCopiedId(null), 2000); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {copiedId === k.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setKeys(prev => prev.filter(x => x.id !== k.id))} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {keys.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-8">No API keys yet</p>
      )}
    </motion.div>
  );

  if (!isMobile && !showLanding) {
    return (
      <DesktopSettingsLayout title="API Keys" subtitle="Manage your API keys">
        <ApiKeysContent />
      </DesktopSettingsLayout>
    );
  }

  if (showLanding) {
    const LandingContent = () => (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">Megsy API</h1>
        <p className="text-muted-foreground mb-8">Build amazing AI-powered applications with our API</p>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { title: "Chat", desc: "Access all chat models via a simple API" },
            { title: "Images", desc: "Generate and edit images programmatically" },
            { title: "Videos", desc: "Create AI videos from text or images" },
          ].map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-border text-left">
              <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setShowLanding(false)} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
          Get Started
        </button>
      </motion.div>
    );

    if (!isMobile) {
      return (
        <DesktopSettingsLayout>
          <div className="py-12">
            <LandingContent />
          </div>
        </DesktopSettingsLayout>
      );
    }

    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <LandingContent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">API Keys</h1>
        </div>
        <div className="px-4">
          <ApiKeysContent />
        </div>
      </div>
    </div>
  );
};

export default ApisPage;
