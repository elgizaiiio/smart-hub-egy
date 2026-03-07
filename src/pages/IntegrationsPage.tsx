import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const integrations = [
  { id: "github", name: "GitHub", description: "Connect repositories & create issues", icon: "https://github.githubassets.com/favicons/favicon-dark.svg", category: "Development", app: "github" },
  { id: "gmail", name: "Gmail", description: "Send and manage emails", icon: "https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png", category: "Communication", app: "gmail" },
  { id: "gdrive", name: "Google Drive", description: "Upload and manage files", icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png", category: "Storage", app: "googledrive" },
  { id: "gcalendar", name: "Google Calendar", description: "Create events & manage schedule", icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png", category: "Productivity", app: "googlecalendar" },
  { id: "notion", name: "Notion", description: "Create pages & manage workspace", icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png", category: "Productivity", app: "notion" },
  { id: "slack", name: "Slack", description: "Send messages to channels", icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png", category: "Communication", app: "slack" },
  { id: "supabase", name: "Supabase", description: "Backend & database management", icon: "https://supabase.com/favicon/favicon-32x32.png", category: "Development", app: "supabase" },
  { id: "hubspot", name: "HubSpot", description: "CRM & marketing automation", icon: "https://www.hubspot.com/favicon.ico", category: "Business", app: "hubspot" },
  { id: "youtube", name: "YouTube", description: "Search & manage video content", icon: "https://www.youtube.com/s/desktop/12d6b690/img/favicon_32x32.png", category: "Social", app: "youtube" },
  { id: "outlook", name: "Outlook", description: "Email & calendar management", icon: "https://res.cdn.office.net/assets/mail/pwa/v1/pngs/favicon-32x32.png", category: "Communication", app: "outlook" },
  { id: "figma", name: "Figma", description: "Design collaboration & assets", icon: "https://static.figma.com/app/icon/1/favicon.png", category: "Development", app: "figma" },
  { id: "teams", name: "Microsoft Teams", description: "Team communication & meetings", icon: "https://res.cdn.office.net/assets/teams/pwa/v1/pngs/favicon-32x32.png", category: "Communication", app: "microsoftteams" },
  { id: "zoom", name: "Zoom", description: "Video meetings & webinars", icon: "https://st1.zoom.us/zoom.ico", category: "Communication", app: "zoom" },
  { id: "instagram", name: "Instagram", description: "Share images and stories", icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png", category: "Social", app: "instagram" },
  { id: "facebook", name: "Facebook", description: "Publish content to Facebook", icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg", category: "Social", app: "facebook" },
  { id: "linkedin", name: "LinkedIn", description: "Share professional content", icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png", category: "Social", app: "linkedin" },
  { id: "discord", name: "Discord", description: "Send messages & manage servers", icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/6266bc493fb42d4e27bb8393_847541504914fd33810e70a0ea73177e.ico", category: "Communication", app: "discord" },
];

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const [connectedApps, setConnectedApps] = useState<Record<string, string>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

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
          if (appName && item.status === "ACTIVE") {
            connected[appName] = item.id;
          }
        });
      }
      setConnectedApps(connected);
    } catch (e) {
      console.error("Failed to load connections:", e);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleConnect = async (integration: typeof integrations[0]) => {
    setLoadingApp(integration.id);
    try {
      const { data, error } = await supabase.functions.invoke("composio", {
        body: { action: "connect", app: integration.app, userId: "default" },
      });
      if (error) throw error;

      // If there's a redirect URL, open it
      if (data?.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "width=600,height=700");
        toast.success(`Opening ${integration.name} authorization...`);
        // Poll for connection status
        setTimeout(() => loadConnections(), 5000);
        setTimeout(() => loadConnections(), 10000);
        setTimeout(() => loadConnections(), 20000);
      } else if (data?.connectionStatus === "ACTIVE") {
        toast.success(`${integration.name} connected!`);
        setConnectedApps(prev => ({ ...prev, [integration.app]: data.id }));
      } else {
        toast.info(`${integration.name} connection initiated. Complete the authorization in the opened window.`);
      }
    } catch (e: any) {
      toast.error(`Failed to connect ${integration.name}: ${e.message || "Unknown error"}`);
    } finally {
      setLoadingApp(null);
    }
  };

  const isConnected = (app: string) => !!connectedApps[app];

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Integrations</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-6 pb-8">
          <p className="text-sm text-muted-foreground">Connect your favorite apps to use them directly from Megsy chat.</p>

          {isLoadingConnections ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">{cat}</p>
                <div className="space-y-2">
                  {integrations.filter(i => i.category === cat).map(integration => (
                    <div key={integration.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                      <img src={integration.icon} alt="" className="w-8 h-8 rounded-lg object-contain" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                      {isConnected(integration.app) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-600">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration)}
                          disabled={loadingApp === integration.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {loadingApp === integration.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Connect"
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
