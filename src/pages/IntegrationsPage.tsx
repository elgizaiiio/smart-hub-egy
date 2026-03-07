import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2, Github, Mail, BookOpen, MessageSquare, Database, Youtube, Figma, Users, Video, Camera, Facebook, Linkedin, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

// Brand SVG Icons
const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
    <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
    <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
    <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.587.234h-8.55V6.577h8.55c.23 0 .424.08.587.234A.778.778 0 0 1 24 7.387z" fill="#0364B8"/>
    <path d="M14.625 6.577v12.098h-8.55a.806.806 0 0 1-.587-.234.778.778 0 0 1-.238-.576V7.387c0-.23.08-.424.238-.576a.806.806 0 0 1 .587-.234h8.55z" fill="#0A2767"/>
    <path d="M8.5 10.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" fill="#0078D4"/>
    <path d="M5 8.25c-.69 0-1.25.56-1.25 1.25v2c0 .69.56 1.25 1.25 1.25s1.25-.56 1.25-1.25v-2c0-.69-.56-1.25-1.25-1.25z" fill="white"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M7.71 3.5L1.15 15l3.44 5.96L11.15 9.46 7.71 3.5z" fill="#0066DA"/>
    <path d="M16.29 3.5H7.71l6.56 11.46h8.58L16.29 3.5z" fill="#00AC47"/>
    <path d="M1.15 15l3.44 5.96h14.82l3.44-5.96H1.15z" fill="#EA4335"/>
  </svg>
);

const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="white"/>
    <path d="M18.316 24L24 18.316V5.684L18.316 0H5.684L0 5.684v12.632L5.684 24h12.632z" fill="#4285F4"/>
    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" fill="white"/>
    <path d="M12 7v5l3.5 2" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HubSpotIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF7A59">
    <path d="M17.002 8.283V5.53a1.97 1.97 0 0 0 1.143-1.783V3.7a1.97 1.97 0 0 0-1.97-1.97h-.048a1.97 1.97 0 0 0-1.97 1.97v.048c0 .776.457 1.447 1.117 1.76v2.775a5.537 5.537 0 0 0-2.794 1.27l-7.384-5.746a2.353 2.353 0 0 0 .076-.585A2.363 2.363 0 1 0 2.81 5.583l7.197 5.602a5.574 5.574 0 0 0 .378 6.415l-2.03 2.03a1.735 1.735 0 0 0-.506-.082 1.768 1.768 0 1 0 1.768 1.768c0-.18-.032-.352-.082-.513l1.997-1.997a5.565 5.565 0 1 0 5.47-10.523z"/>
  </svg>
);

const integrations = [
  { id: "github", name: "GitHub", description: "Connect repositories & create issues", icon: Github, category: "Development", app: "github" },
  { id: "gmail", name: "Gmail", description: "Send and manage emails", icon: Mail, category: "Communication", app: "gmail" },
  { id: "gdrive", name: "Google Drive", description: "Upload and manage files", icon: GoogleDriveIcon, category: "Storage", app: "googledrive", isSvg: true },
  { id: "gcalendar", name: "Google Calendar", description: "Create events & manage schedule", icon: GoogleCalendarIcon, category: "Productivity", app: "googlecalendar", isSvg: true },
  { id: "notion", name: "Notion", description: "Create pages & manage workspace", icon: BookOpen, category: "Productivity", app: "notion" },
  { id: "slack", name: "Slack", description: "Send messages to channels", icon: SlackIcon, category: "Communication", app: "slack", isSvg: true },
  { id: "supabase", name: "Supabase", description: "Backend & database management", icon: Database, category: "Development", app: "supabase" },
  { id: "hubspot", name: "HubSpot", description: "CRM & marketing automation", icon: HubSpotIcon, category: "Business", app: "hubspot", isSvg: true },
  { id: "youtube", name: "YouTube", description: "Search & manage video content", icon: Youtube, category: "Social", app: "youtube" },
  { id: "outlook", name: "Outlook", description: "Email & calendar management", icon: OutlookIcon, category: "Communication", app: "outlook", isSvg: true },
  { id: "figma", name: "Figma", description: "Design collaboration & assets", icon: Figma, category: "Development", app: "figma" },
  { id: "teams", name: "Microsoft Teams", description: "Team communication & meetings", icon: Users, category: "Communication", app: "microsoftteams" },
  { id: "zoom", name: "Zoom", description: "Video meetings & webinars", icon: Video, category: "Communication", app: "zoom" },
  { id: "instagram", name: "Instagram", description: "Share images and stories", icon: Camera, category: "Social", app: "instagram" },
  { id: "facebook", name: "Facebook", description: "Publish content to Facebook", icon: Facebook, category: "Social", app: "facebook" },
  { id: "linkedin", name: "LinkedIn", description: "Share professional content", icon: Linkedin, category: "Social", app: "linkedin" },
  { id: "discord", name: "Discord", description: "Send messages & manage servers", icon: DiscordIcon, category: "Communication", app: "discord", isSvg: true },
];

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [connectedApps, setConnectedApps] = useState<Record<string, string>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

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

  const handleConnect = async (integration: typeof integrations[0]) => {
    setLoadingApp(integration.id);
    try {
      const { data, error } = await supabase.functions.invoke("composio", {
        body: { action: "connect", app: integration.app, userId: "default" },
      });
      if (error) throw error;
      if (data?.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "width=600,height=700");
        toast.success(`Opening ${integration.name} authorization...`);
        setTimeout(() => loadConnections(), 5000);
        setTimeout(() => loadConnections(), 10000);
        setTimeout(() => loadConnections(), 20000);
      } else if (data?.connectionStatus === "ACTIVE") {
        toast.success(`${integration.name} connected!`);
        setConnectedApps(prev => ({ ...prev, [integration.app]: data.id }));
      } else {
        toast.info(`${integration.name} connection initiated.`);
      }
    } catch (e: any) {
      toast.error(`Failed to connect ${integration.name}: ${e.message || "Unknown error"}`);
    } finally {
      setLoadingApp(null);
    }
  };

  const isConnected = (app: string) => !!connectedApps[app];
  const categories = [...new Set(integrations.map(i => i.category))];

  const IntegrationsContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8 max-w-2xl">
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
              {integrations.filter(i => i.category === cat).map(integration => {
                const Icon = integration.icon;
                const isSvgIcon = (integration as any).isSvg;
                return (
                  <div key={integration.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      {isSvgIcon ? <Icon /> : <Icon className="w-5 h-5 text-foreground" />}
                    </div>
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
                        {loadingApp === integration.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Integrations" subtitle="Connect your favorite apps">
        <IntegrationsContent />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Integrations</h1>
        </div>
        <div className="px-4">
          <IntegrationsContent />
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
