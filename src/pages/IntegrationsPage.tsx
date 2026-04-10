import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Check, Loader2, Search, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import { integrations, INTEGRATION_CATEGORIES, type Integration } from "@/lib/integrationsData";
import IntegrationDetailModal from "@/components/IntegrationDetailModal";

const ICON_BASE = "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons";

function getIntegrationIcon(app: string): string | null {
  const map: Record<string, string> = {
    gmail: "gmail", outlook: "microsoftoutlook", slack: "slack", discord: "discord",
    microsoftteams: "microsoftteams", zoom: "zoom", telegram: "telegram",
    whatsapp: "whatsapp", twilio: "twilio", sendgrid: "sendgrid", mailchimp: "mailchimp",
    intercom: "intercom", notion: "notion", googlecalendar: "googlecalendar",
    todoist: "todoist", trello: "trello", evernote: "evernote", asana: "asana",
    clickup: "clickup", monday: "monday", github: "github", gitlab: "gitlab",
    bitbucket: "bitbucket", jira: "jira", linear: "linear", vercel: "vercel",
    netlify: "netlify", docker: "docker", kubernetes: "kubernetes",
    salesforce: "salesforce", hubspot: "hubspot", pipedrive: "pipedrive",
    stripe: "stripe", paypal: "paypal", shopify: "shopify",
    instagram: "instagram", twitter: "x", facebook: "facebook", linkedin: "linkedin",
    tiktok: "tiktok", youtube: "youtube", pinterest: "pinterest", reddit: "reddit",
    googledrive: "googledrive", dropbox: "dropbox", onedrive: "microsoftonedrive",
    box: "box", figma: "figma", canva: "canva", adobephotoshop: "adobephotoshop",
    googleanalytics: "googleanalytics", mixpanel: "mixpanel", segment: "segment",
    zendesk: "zendesk", freshdesk: "freshdesk", wordpress: "wordpress",
    wix: "wix", squarespace: "squarespace", aws: "amazonwebservices",
    googlecloud: "googlecloud", azure: "microsoftazure",
    postgresql: "postgresql", mongodb: "mongodb", mysql: "mysql", redis: "redis",
    firebase: "firebase", supabase: "supabase", airtable: "airtable",
    twitch: "twitch", spotify: "spotify", vimeo: "vimeo",
    zapier: "zapier", ifttt: "ifttt", make: "make",
    openai: "openai", anthropic: "anthropic",
    googlesheets: "googlesheets", googledocs: "googledocs", microsoftexcel: "microsoftexcel",
    confluence: "confluence", bamboohr: "bamboohr", gusto: "gusto",
    quickbooks: "quickbooks", xero: "xero", freshbooks: "freshbooks",
    mailgun: "mailgun", postmark: "postmark", brevo: "brevo",
    calendly: "calendly", typeform: "typeform", surveymonkey: "surveymonkey",
    miro: "miro", loom: "loom", webflow: "webflow",
    sentry: "sentry", datadog: "datadog", newrelic: "newrelic",
    grafana: "grafana", elasticsearch: "elasticsearch",
    pagerduty: "pagerduty", statuspage: "statuspage",
    tableau: "tableau", powerbi: "powerbi",
    algolia: "algolia", cloudflare: "cloudflare",
    heroku: "heroku", digitalocean: "digitalocean",
  };
  return map[app] ? `${ICON_BASE}/${map[app]}.svg` : null;
}

// Floating icons animation for hero
const FloatingIcons = () => {
  const icons = ["gmail", "slack", "github", "notion", "figma", "discord", "stripe", "shopify", "zoom", "linkedin"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((name, i) => {
        const iconUrl = getIntegrationIcon(name);
        const angle = (i / icons.length) * 360;
        const radius = 120;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return (
          <motion.div
            key={name}
            className="absolute w-10 h-10 rounded-xl bg-card/80 border border-border/30 flex items-center justify-center backdrop-blur-sm"
            style={{ left: `calc(50% + ${x}px - 20px)`, top: `calc(50% + ${y}px - 20px)` }}
            animate={{
              y: [0, -8, 0, 8, 0],
              x: [0, 4, 0, -4, 0],
              rotate: [0, 3, 0, -3, 0],
            }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {iconUrl && <img src={iconUrl} alt="" className="w-5 h-5 dark:invert opacity-70" loading="lazy" />}
          </motion.div>
        );
      })}
      {/* Center pulsing orb */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 hsl(var(--primary)/0)", "0 0 30px 10px hsl(var(--primary)/0.15)", "0 0 0 0 hsl(var(--primary)/0)"] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </motion.div>
    </div>
  );
};

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [connectedApps, setConnectedApps] = useState<Record<string, string>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

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
        const returnUrl = window.location.href;
        const redirectWithReturn = data.redirectUrl + (data.redirectUrl.includes("?") ? "&" : "?") + `redirect_url=${encodeURIComponent(returnUrl)}`;
        const authWindow = window.open(redirectWithReturn, "_blank", "width=600,height=700");
        if (!authWindow) {
          window.location.href = redirectWithReturn;
          return;
        }
        toast.success(`Opening ${integration.name} authorization...`);
        const pollInterval = setInterval(async () => {
          try {
            if (authWindow.closed) {
              clearInterval(pollInterval);
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
        setTimeout(() => { clearInterval(pollInterval); setLoadingApp(null); }, 120000);
        return;
      } else if (data?.connectionStatus === "ACTIVE") {
        toast.success(`${integration.name} connected`);
        setConnectedApps((prev) => ({ ...prev, [integration.app]: data.id }));
      }
    } catch {
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
      setConnectedApps((prev) => { const next = { ...prev }; delete next[integration.app]; return next; });
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
      const matchesSearch = !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || i.category === selectedCategory;
      const matchesConnected = !showConnectedOnly || isConnected(i.app);
      return matchesSearch && matchesCategory && matchesConnected;
    });
  }, [search, selectedCategory, showConnectedOnly, connectedApps]);

  const featured = useMemo(() => {
    const featuredApps = ["gmail", "slack", "notion", "github", "googledrive", "discord", "stripe", "shopify", "figma", "hubspot"];
    return integrations.filter(i => featuredApps.includes(i.app));
  }, []);

  const content = (
    <div className="min-h-screen bg-background">
      {/* Hero with floating animation */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-6">
          {isMobile && (
            <button onClick={() => navigate("/settings")} className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
            {/* Animation zone */}
            <div className="relative h-64 mb-4">
              <FloatingIcons />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-[1.1]">
              {integrations.length}+ Integrations
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
              Connect your favorite tools and automate workflows directly from the chat.
            </p>
            {connectedCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {connectedCount} connected
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-secondary/20 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Category pills */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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

        {/* Connected only toggle */}
        {connectedCount > 0 && (
          <button
            onClick={() => setShowConnectedOnly(!showConnectedOnly)}
            className={`mt-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showConnectedOnly ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/20 border-border text-muted-foreground"
            }`}
          >
            Connected only
          </button>
        )}
      </div>

      {/* Featured row (only when no search) */}
      {!search && selectedCategory === "All" && !showConnectedOnly && (
        <div className="max-w-3xl mx-auto px-4 mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Featured</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {featured.map((integration) => {
              const connected = isConnected(integration.app);
              const iconUrl = getIntegrationIcon(integration.app);
              return (
                <button
                  key={integration.id}
                  onClick={() => setSelectedIntegration(integration)}
                  className="shrink-0 w-20 flex flex-col items-center gap-1.5 group"
                >
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                    connected ? "bg-primary/5 border-primary/20" : "bg-card border-border/30 group-hover:border-border/60"
                  }`}>
                    {iconUrl ? (
                      <img src={iconUrl} alt="" className="w-7 h-7 dark:invert" loading="lazy" />
                    ) : (
                      <span className="text-base font-bold text-muted-foreground">{integration.name.charAt(0)}</span>
                    )}
                    {connected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">{integration.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Integration List */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {isLoadingConnections ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No integrations found</div>
        ) : (
          <div className="space-y-1">
            {filtered.map((integration, i) => {
              const connected = isConnected(integration.app);
              const isLoading = loadingApp === integration.id;
              const iconUrl = getIntegrationIcon(integration.app);
              return (
                <motion.button
                  key={integration.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  onClick={() => setSelectedIntegration(integration)}
                  className="w-full flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-muted/30 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    connected ? "bg-primary/5 border-primary/20" : "bg-card border-border/30"
                  }`}>
                    {iconUrl ? (
                      <img src={iconUrl} alt="" className="w-5 h-5 dark:invert" loading="lazy" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{integration.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{integration.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
                  </div>
                  {connected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  )}
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <IntegrationDetailModal
        integration={selectedIntegration}
        isConnected={selectedIntegration ? isConnected(selectedIntegration.app) : false}
        isLoading={selectedIntegration ? loadingApp === selectedIntegration.id : false}
        onConnect={() => selectedIntegration && handleConnect(selectedIntegration)}
        onDisconnect={() => selectedIntegration && handleDisconnect(selectedIntegration)}
        onClose={() => setSelectedIntegration(null)}
      />
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Integrations" subtitle={`${integrations.length}+ apps available`}>
        {content}
      </DesktopSettingsLayout>
    );
  }

  return content;
};

export default IntegrationsPage;
