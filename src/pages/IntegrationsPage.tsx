import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Check, Loader2, Search, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import { integrations, INTEGRATION_CATEGORIES, type Integration } from "@/lib/integrationsData";

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [connectedApps, setConnectedApps] = useState<Record<string, string>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);

  useEffect(() => { loadConnections(); }, []);

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("composio", {
        body: { action: "list-connections", userId: "default" },
      });
      if (error) throw error;
      const items = data?.items || data || [];
      const connected: Record<string, string> = {};
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const appName = (item.appName || item.appUniqueId || "").toLowerCase();
          if (appName && item.status === "ACTIVE") connected[appName] = item.id;
        });
      }
      setConnectedApps(connected);
    } catch (e) {
      console.error("Failed to load connections:", e);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    setLoadingApp(integration.id);
    try {
      const { data, error } = await supabase.functions.invoke("composio", {
        body: { action: "connect", app: integration.app, userId: "default" },
      });
      if (error) throw error;
      if (data?.redirectUrl) {
        // Open in same window for proper OAuth redirect back
        const returnUrl = window.location.href;
        const redirectWithReturn = data.redirectUrl + (data.redirectUrl.includes("?") ? "&" : "?") + `redirect_url=${encodeURIComponent(returnUrl)}`;
        const authWindow = window.open(redirectWithReturn, "_blank", "width=600,height=700");
        if (!authWindow) {
          // Fallback: redirect current page
          window.location.href = redirectWithReturn;
          return;
        }
        toast.success(`Opening ${integration.name} authorization...`);
        const pollInterval = setInterval(async () => {
          try {
            if (authWindow.closed) {
              clearInterval(pollInterval);
              // Re-check connections after window closes
              await loadConnections();
              setLoadingApp(null);
              return;
            }
            const { data: checkData } = await supabase.functions.invoke("composio", {
              body: { action: "list-connections", userId: "default" },
            });
            const items = checkData?.items || checkData || [];
            if (Array.isArray(items)) {
              const found = items.find(
                (item: any) =>
                  (item.appName || item.appUniqueId || "").toLowerCase() === integration.app &&
                  item.status === "ACTIVE"
              );
              if (found) {
                clearInterval(pollInterval);
                authWindow.close();
                setConnectedApps((prev) => ({ ...prev, [integration.app]: found.id }));
                toast.success(`${integration.name} connected successfully`);
                setLoadingApp(null);
              }
            }
          } catch {}
        }, 2500);
        setTimeout(() => {
          clearInterval(pollInterval);
          setLoadingApp(null);
        }, 120000);
        return;
      } else if (data?.connectionStatus === "ACTIVE") {
        toast.success(`${integration.name} connected`);
        setConnectedApps((prev) => ({ ...prev, [integration.app]: data.id }));
      }
    } catch (e: any) {
      toast.error(`Failed to connect ${integration.name}`);
    } finally {
      setLoadingApp(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    const connectionId = connectedApps[integration.app];
    if (!connectionId) return;
    setLoadingApp(integration.id);
    try {
      const { error } = await supabase.functions.invoke("composio", {
        body: { action: "disconnect", connectionId, userId: "default" },
      });
      if (error) throw error;
      setConnectedApps((prev) => {
        const next = { ...prev };
        delete next[integration.app];
        return next;
      });
      toast.success(`${integration.name} disconnected`);
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setLoadingApp(null);
    }
  };

  const isConnected = (app: string) => !!connectedApps[app];
  const connectedCount = Object.keys(connectedApps).length;

  const filtered = useMemo(() => {
    return integrations.filter((i) => {
      const matchesSearch =
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || i.category === selectedCategory;
      const matchesConnected = !showConnectedOnly || isConnected(i.app);
      return matchesSearch && matchesCategory && matchesConnected;
    });
  }, [search, selectedCategory, showConnectedOnly, connectedApps]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (selectedCategory !== "All") return { [selectedCategory]: filtered };
    const groups: Record<string, Integration[]> = {};
    filtered.forEach((i) => {
      if (!groups[i.category]) groups[i.category] = [];
      groups[i.category].push(i);
    });
    return groups;
  }, [filtered, selectedCategory]);

  const content = (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-8">
          {isMobile && (
            <button
              onClick={() => navigate("/settings")}
              className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-[1.1]">
              {integrations.length}+ Integrations
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base max-w-lg mx-auto">
              Connect your favorite tools and automate workflows directly from the chat.
              Powered by Composio — secure OAuth2 with encrypted tokens.
            </p>
            {connectedCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {connectedCount} connected
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-secondary/20 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={() => setShowConnectedOnly(!showConnectedOnly)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
              showConnectedOnly
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/20 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Connected only
          </button>
        </div>

        {/* Category pills */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {INTEGRATION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        {isLoadingConnections ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No integrations found matching your search
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([category, items]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {selectedCategory === "All" && (
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      {category}
                    </h2>
                    <div className="flex-1 h-px bg-border/30" />
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {items.map((integration, i) => {
                    const connected = isConnected(integration.app);
                    const isLoading = loadingApp === integration.id;
                    return (
                      <motion.button
                        key={integration.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        onClick={() =>
                          connected
                            ? handleDisconnect(integration)
                            : handleConnect(integration)
                        }
                        disabled={isLoading}
                        className={`relative text-left p-3 rounded-xl border transition-all group ${
                          connected
                            ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                            : "bg-secondary/10 border-border/20 hover:border-border/50 hover:bg-secondary/20"
                        }`}
                      >
                        {connected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                            {integration.name.charAt(0)}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-tight truncate">
                          {integration.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                          {integration.description}
                        </p>
                        {isLoading && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout
        title="Integrations"
        subtitle={`${integrations.length}+ apps available`}
      >
        {content}
      </DesktopSettingsLayout>
    );
  }

  return content;
};

export default IntegrationsPage;
