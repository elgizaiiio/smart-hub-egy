import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const integrations = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Send and manage emails",
    icon: "https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png",
    category: "Communication",
  },
  {
    id: "gdrive",
    name: "Google Drive",
    description: "Upload and manage files",
    icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png",
    category: "Storage",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories",
    icon: "https://github.githubassets.com/favicons/favicon-dark.svg",
    category: "Development",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Backend & database",
    icon: "https://supabase.com/favicon/favicon-32x32.png",
    category: "Development",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Publish content to Facebook",
    icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    category: "Social",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Share images and stories",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    category: "Social",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Share professional content",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    category: "Social",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages to channels",
    icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
    category: "Communication",
  },
];

const IntegrationsPage = () => {
  const navigate = useNavigate();

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
          <p className="text-sm text-muted-foreground">Connect your favorite apps to enhance Megsy across all modes.</p>

          {categories.map(cat => (
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
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
