import { useState } from "react";
import { ArrowLeft, Plus, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/api/docs" className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
          <h3 className="font-display text-sm font-semibold text-foreground mb-1">Documentation</h3>
          <p className="text-xs text-muted-foreground">Integration guides & code examples</p>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary mt-2 transition-colors" />
        </Link>
        <Link to="/api/models" className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
          <h3 className="font-display text-sm font-semibold text-foreground mb-1">Models</h3>
          <p className="text-xs text-muted-foreground">Browse 70+ AI models & pricing</p>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary mt-2 transition-colors" />
        </Link>
      </div>

      {/* API Keys */}
      <div>
        <h2 className="font-display text-sm font-semibold text-foreground mb-3">API Keys</h2>
        <button onClick={() => setShowCreate(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
          <Plus className="w-4 h-4" /> Create new key
        </button>

        {showCreate && (
          <div className="p-4 rounded-xl border border-border mt-3 space-y-3">
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

        <div className="mt-3 space-y-2">
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
            <p className="text-sm text-muted-foreground text-center py-6">No API keys yet</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="API Keys" subtitle="Manage your API keys and integrations">
        {content}
      </DesktopSettingsLayout>
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
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default ApisPage;
